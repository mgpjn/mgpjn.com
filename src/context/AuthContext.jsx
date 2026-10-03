import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, loginUser, logoutUser, registerUser } from '../services/api';

import LoginSecuritySetup from '../components/auth/LoginSecuritySetup';
import { clearQuickLogin, keepQuickLoginForAccount, quickLoginState, unlockDeviceLogin, unlockLoginPin } from '../services/quickLogin';

const AuthContext = createContext(null);

const SESSION_DURATION_MS = 48 * 60 * 60 * 1000; // 48 Hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      // 1. Check tab-isolated session storage first (for impersonated new-tab sessions)
      const sessionToken = sessionStorage.getItem('mediglaxo_session_token');
      if (sessionToken) {
        return sessionToken;
      }

      // 2. Check standard persistent localStorage
      const savedToken = localStorage.getItem('mediglaxo_token');
      let loginTime = localStorage.getItem('mediglaxo_login_time');
      if (savedToken) {
        if (!loginTime) {
          loginTime = Date.now().toString();
          localStorage.setItem('mediglaxo_login_time', loginTime);
        }
        const elapsed = Date.now() - Number(loginTime);
        if (elapsed < SESSION_DURATION_MS) {
          return savedToken;
        }
      }
    } catch {}
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      // 1. Check tab-isolated session storage first
      const sessionUser = sessionStorage.getItem('mediglaxo_session_user');
      if (sessionUser) {
        return JSON.parse(sessionUser);
      }

      // 2. Check standard persistent localStorage
      const savedUser = localStorage.getItem('mediglaxo_user');
      let loginTime = localStorage.getItem('mediglaxo_login_time');
      if (savedUser) {
        if (!loginTime) {
          loginTime = Date.now().toString();
          localStorage.setItem('mediglaxo_login_time', loginTime);
        }
        const elapsed = Date.now() - Number(loginTime);
        if (elapsed < SESSION_DURATION_MS) {
          return JSON.parse(savedUser);
        }
      }
    } catch {}
    return null;
  });

  const [offerSetup, setOfferSetup] = useState(false);

  const [loading, setLoading] = useState(!user && Boolean(token));

  const clearSession = () => {
    if (sessionStorage.getItem('mediglaxo_session_token')) {
      sessionStorage.removeItem('mediglaxo_session_token');
      sessionStorage.removeItem('mediglaxo_session_user');
      sessionStorage.removeItem('mediglaxo_is_impersonated');
    } else {
      localStorage.removeItem('mediglaxo_token');
      localStorage.removeItem('mediglaxo_user');
      localStorage.removeItem('mediglaxo_login_time');
    }
    setOfferSetup(false);
    setToken(null);
    setUser(null);
  };

  const setImpersonatedSession = (newToken, newUser) => {
    sessionStorage.setItem('mediglaxo_session_token', newToken);
    if (newUser) {
      sessionStorage.setItem('mediglaxo_session_user', JSON.stringify(newUser));
    }
    sessionStorage.setItem('mediglaxo_is_impersonated', 'true');
    setToken(newToken);
    if (newUser) {
      setUser(newUser);
    }
  };

  // 48-Hour Automatic Expiration Monitor
  useEffect(() => {
    const checkExpiry = () => {
      const loginTime = localStorage.getItem('mediglaxo_login_time');
      if (loginTime) {
        const elapsed = Date.now() - Number(loginTime);
        if (elapsed >= SESSION_DURATION_MS) {
          clearSession();
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 5 * 60 * 1000); // check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Sync / Verify profile with backend on mount
  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.user);
            if (sessionStorage.getItem('mediglaxo_session_token')) {
              sessionStorage.setItem('mediglaxo_session_user', JSON.stringify(res.data.user));
            } else {
              localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
            }
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            clearSession();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.data?.requires_2fa) {
      return res.data;
    }
    if (res.data?.success && res.data?.token) {
      keepQuickLoginForAccount(res.data.user.id);
      setOfferSetup(res.data.user.role !== 'super_admin');
      const now = Date.now().toString();
      localStorage.setItem('mediglaxo_token', res.data.token);
      localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
      localStorage.setItem('mediglaxo_login_time', now);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.data.success) {
      keepQuickLoginForAccount(res.data.user.id);
      setOfferSetup(res.data.user.role !== 'super_admin');
      const now = Date.now().toString();
      localStorage.setItem('mediglaxo_token', res.data.token);
      localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
      localStorage.setItem('mediglaxo_login_time', now);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      if (token && (isImpersonated || (!quickLoginState(user?.id).pin && !quickLoginState(user?.id).biometric))) await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      clearSession();
    }
  };

  const isImpersonated = Boolean(sessionStorage.getItem('mediglaxo_is_impersonated'));

  const setDirectSession = (newToken, newUser, offer = true) => {
    keepQuickLoginForAccount(newUser?.id);
    setOfferSetup(offer && newUser?.role !== 'super_admin');
    const now = Date.now().toString();
    localStorage.setItem('mediglaxo_token', newToken);
    if (newUser) {
      localStorage.setItem('mediglaxo_user', JSON.stringify(newUser));
    }
    localStorage.setItem('mediglaxo_login_time', now);
    setToken(newToken);
    if (newUser) {
      setUser(newUser);
    }
  };

  const restoreQuickSession = async (unlock, phone) => {
    const saved = await unlock();
    try {
      const res = await getProfile({ headers: { Authorization: `Bearer ${saved.token}` } });
      if (!res.data?.success || String(res.data.user?.id) !== String(saved.userId) || res.data.user?.role === 'super_admin' || (res.data.user?.status && res.data.user.status !== 'active')) {
        clearQuickLogin();
        throw new Error('Please sign in with OTP or password again.');
      }
      if (phone && String(res.data.user.phone || '').replace(/\D/g, '').slice(-10) !== phone) {
        throw new Error('This mobile number does not match the saved PIN account. Use OTP/password for this number.');
      }
      setDirectSession(saved.token, res.data.user, false);
      return res.data;
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        clearQuickLogin();
        throw new Error('Saved login expired. Please sign in with OTP or password again.');
      }
      throw err;
    }
  };
  const loginWithPin = (pin, phone) => restoreQuickSession(() => unlockLoginPin(pin), phone);
  const loginWithDevice = () => restoreQuickSession(unlockDeviceLogin);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, setImpersonatedSession, setDirectSession, isImpersonated, loginWithPin, loginWithDevice }}>
      {children}
      {offerSetup && user && token && !isImpersonated && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Set up login security">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto"><LoginSecuritySetup user={user} token={token} onClose={() => setOfferSetup(false)} /></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

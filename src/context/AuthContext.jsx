import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, loginUser, logoutUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

const SESSION_DURATION_MS = 48 * 60 * 60 * 1000; // 48 Hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
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

  const [loading, setLoading] = useState(!user && Boolean(token));

  const clearSession = () => {
    localStorage.removeItem('mediglaxo_token');
    localStorage.removeItem('mediglaxo_user');
    localStorage.removeItem('mediglaxo_login_time');
    setToken(null);
    setUser(null);
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
            localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.data.success) {
      const now = Date.now().toString();
      localStorage.setItem('mediglaxo_token', res.data.token);
      localStorage.setItem('mediglaxo_user', JSON.stringify(res.data.user));
      localStorage.setItem('mediglaxo_login_time', now);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.data.success) {
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
      if (token) await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ImpersonateSessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setImpersonatedSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const dest = searchParams.get('dest') || '/';

    if (token) {
      let userData = null;
      try {
        if (userParam) {
          userData = JSON.parse(userParam);
        }
      } catch (e) {
        console.error('Failed to parse impersonated user:', e);
      }

      // Store in isolated sessionStorage for this specific tab
      sessionStorage.setItem('mediglaxo_session_token', token);
      if (userData) {
        sessionStorage.setItem('mediglaxo_session_user', JSON.stringify(userData));
      }
      sessionStorage.setItem('mediglaxo_is_impersonated', 'true');

      // Update AuthContext state for this tab
      if (setImpersonatedSession) {
        setImpersonatedSession(token, userData);
      }

      // Smoothly navigate to the destination
      navigate(dest, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setImpersonatedSession]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4 px-4">
      <div className="w-12 h-12 border-3 border-brand-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-center space-y-1.5">
        <h3 className="text-base font-black">Opening Account in New Tab...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Preparing isolated session. Super Admin dashboard will remain active in the previous tab.
        </p>
      </div>
    </div>
  );
}

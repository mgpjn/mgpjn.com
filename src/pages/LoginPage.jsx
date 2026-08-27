import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({ login: loginInput, password });
      const role = data.user.role;
      if (role === 'admin' || role === 'super_admin') {
        navigate('/admin');
      } else if (['super_distributor', 'distributor', 'sub_distributor', 'retailer'].includes(role)) {
        navigate('/hierarchy');
      } else if (role === 'sub_retailer' || role === 'member') {
        navigate('/mlm');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="MediGlaxo Pharma Junction" className="h-16 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to MediGlaxo</h2>
          <p className="text-xs text-slate-400">Access your pharmacy account, orders, and management portals</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email / Phone / Member ID</label>
            <input
              type="text"
              name="login"
              id="login-input"
              autoComplete="username"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. admin@mediglaxo.com or SUPER100"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              id="password-input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-orange-500 font-bold hover:underline">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}

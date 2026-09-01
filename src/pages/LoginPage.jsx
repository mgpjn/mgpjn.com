import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, CheckCircle2, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendForgotPasswordOtp, resetPasswordWithOtp } from '../services/api';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const role = user.role;
      if (role === 'admin' || role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (['super_distributor', 'distributor', 'sub_distributor', 'retailer'].includes(role)) {
        navigate('/hierarchy', { replace: true });
      } else if (role === 'sub_retailer' || role === 'member') {
        navigate('/mlm', { replace: true });
      } else {
        navigate('/shop', { replace: true });
      }
    }
  }, [user, navigate]);

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail) {
      setOtpError('Please enter your registered email address.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setOtpMessage('');

    try {
      const res = await sendForgotPasswordOtp({ email: forgotEmail });
      if (res.data.success) {
        setOtpMessage(res.data.message || `OTP sent to ${forgotEmail}`);
        setForgotStep(2);
        setResendTimer(60);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP. Please check email address.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setOtpError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setOtpMessage('');

    try {
      const res = await resetPasswordWithOtp({
        email: forgotEmail,
        otp: forgotOtp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (res.data.success) {
        alert('Password reset successfully! Please sign in with your new password.');
        setShowForgotModal(false);
        setForgotStep(1);
        setLoginInput(forgotEmail);
        setPassword(newPassword);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP or expired. Please try again.');
    } finally {
      setOtpLoading(false);
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginInput.includes('@') ? loginInput : '');
                  setForgotStep(1);
                  setOtpError('');
                  setOtpMessage('');
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-bold text-brand-orange-500 hover:text-brand-orange-600 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
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

      {/* ======================================================== */}
      {/* FORGOT PASSWORD & EMAIL OTP VERIFICATION MODAL          */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-orange-500 via-orange-600 to-amber-600 text-white p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Reset Password</h3>
                  <p className="text-xs text-orange-100 font-medium">Official Verification via no-reply@mgpjn.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {otpError}
                </div>
              )}

              {otpMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{otpMessage}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                /* Step 1: Request OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Enter your registered email address. We will send a secure 6-digit OTP code to verify your identity.
                  </p>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Registered Email *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-brand-orange-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP & New Password */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Enter 6-Digit OTP *</label>
                      {resendTimer > 0 ? (
                        <span className="text-[10px] text-slate-400 font-bold">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                          className="text-[11px] font-bold text-brand-orange-500 hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      className="w-full text-center tracking-[8px] font-mono text-lg font-black py-2.5 bg-orange-50/50 border-2 border-orange-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-brand-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Check inbox of: {forgotEmail}</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-orange-500"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={otpLoading || forgotOtp.length !== 6}
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{otpLoading ? 'Resetting...' : 'Reset Password'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

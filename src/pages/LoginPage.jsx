import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, CheckCircle2, RefreshCw, X, ShieldCheck, Smartphone, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendForgotPasswordOtp, resetPasswordWithOtp, verifySuperAdmin2Fa, loginWithPhone } from '../services/api';
import { sendFirebasePhoneOtp } from '../config/firebase';

export default function LoginPage() {
  const { user, login, setDirectSession } = useAuth();
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

  // Login Modes: 'password' | 'phone_otp'
  const [loginMode, setLoginMode] = useState('password');

  // Password Login State
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Super Admin 2FA Verification State
  const [superAdmin2FaRequired, setSuperAdmin2FaRequired] = useState(false);
  const [superAdminOtp, setSuperAdminOtp] = useState('');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminMaskedEmail, setSuperAdminMaskedEmail] = useState('');
  const [verifying2Fa, setVerifying2Fa] = useState(false);
  const [superAdminResendTimer, setSuperAdminResendTimer] = useState(0);
  const [resending2Fa, setResending2Fa] = useState(false);

  // Phone OTP Login State (Firebase Phone Auth)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
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
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    let interval = null;
    if (superAdminResendTimer > 0) {
      interval = setInterval(() => setSuperAdminResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [superAdminResendTimer]);

  useEffect(() => {
    let interval = null;
    if (phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneTimer]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({ login: loginInput, password });
      
      // If Super Admin 2FA is required by backend
      if (data.requires_2fa) {
        setSuperAdmin2FaRequired(true);
        setSuperAdminEmail(data.full_email || loginInput);
        setSuperAdminMaskedEmail(data.email || 'your email');
        setLoading(false);
        return;
      }

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

  // Verify Super Admin 2FA Email OTP
  const handleVerify2FaSubmit = async (e) => {
    e.preventDefault();
    if (superAdminOtp.length !== 6) {
      setError('Please enter the complete 6-digit 2FA code.');
      return;
    }
    setVerifying2Fa(true);
    setError('');

    try {
      const res = await verifySuperAdmin2Fa({
        email: superAdminEmail,
        otp: superAdminOtp,
      });

      if (res.data.success) {
        setDirectSession(res.data.token, res.data.user);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code. Please check and try again.');
    } finally {
      setVerifying2Fa(false);
    }
  };

  const handleResend2Fa = async () => {
    if (superAdminResendTimer > 0 || resending2Fa) return;
    setResending2Fa(true);
    setError('');
    try {
      const data = await login({ login: superAdminEmail, password });
      if (data?.requires_2fa) {
        setSuperAdminResendTimer(60);
        setSuperAdminOtp('');
        alert('A new 6-digit 2FA code has been sent to ' + (data.full_email || superAdminEmail));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend 2FA code.');
    } finally {
      setResending2Fa(false);
    }
  };

  // Send Firebase Phone OTP
  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');

    try {
      const result = await sendFirebasePhoneOtp(cleanNumber, 'recaptcha-container');
      setConfirmationResult(result);
      setPhoneOtpSent(true);
      setPhoneTimer(60);
    } catch (err) {
      console.error('Firebase Phone Auth Error:', err);
      setPhoneError(err.message || 'Failed to send SMS OTP. Please check phone number.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Verify Firebase Phone OTP & Login
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (phoneOtp.length !== 6) {
      setPhoneError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }
    if (!confirmationResult) {
      setPhoneError('Session expired. Please request a new OTP.');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');

    try {
      // 1. Confirm OTP with Firebase
      await confirmationResult.confirm(phoneOtp);

      // 2. Authorize with Backend
      const res = await loginWithPhone({ phone: phoneNumber });
      if (res.data.success) {
        // If Super Admin Phone Login requires 2FA
        if (res.data.requires_2fa) {
          setSuperAdmin2FaRequired(true);
          setSuperAdminEmail(res.data.full_email);
          setSuperAdminMaskedEmail(res.data.email);
          setPhoneLoading(false);
          return;
        }

        setDirectSession(res.data.token, res.data.user);
        const role = res.data.user.role;
        if (role === 'admin' || role === 'super_admin') {
          navigate('/admin');
        } else if (['super_distributor', 'distributor', 'sub_distributor', 'retailer'].includes(role)) {
          navigate('/hierarchy');
        } else if (role === 'sub_retailer' || role === 'member') {
          navigate('/mlm');
        } else {
          navigate('/shop');
        }
      }
    } catch (err) {
      console.error('Phone verification error:', err);
      setPhoneError(err.response?.data?.message || err.message || 'Invalid SMS OTP entered. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="MediGlaxo Pharma Junction" className="h-16 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to MediGlaxo</h2>
          <p className="text-xs text-slate-400">Access your pharmacy account, orders, and management portals</p>
        </div>

        {/* Super Admin 2FA Email OTP Verification Step */}
        {superAdmin2FaRequired ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-black text-amber-950">Super Admin 2-Step Verification</h4>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                Master security code dispatched to <strong className="font-mono text-amber-950 font-bold">{superAdminMaskedEmail}</strong> via <strong>no-reply@mgpjn.com</strong>.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify2FaSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter 6-Digit 2FA Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={superAdminOtp}
                  onChange={(e) => setSuperAdminOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 684920"
                  className="w-full text-center tracking-[8px] font-mono text-xl font-black py-3 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">Didn't receive email? Check Spam folder</span>
                  <button
                    type="button"
                    onClick={handleResend2Fa}
                    disabled={superAdminResendTimer > 0 || resending2Fa}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resending2Fa ? 'Sending...' : superAdminResendTimer > 0 ? `Resend in ${superAdminResendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuperAdmin2FaRequired(false);
                    setSuperAdminOtp('');
                    setError('');
                  }}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying2Fa || superAdminOtp.length !== 6}
                  className="w-2/3 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {verifying2Fa ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{verifying2Fa ? 'Verifying...' : 'Authorize Access'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Login Mode Toggle Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginMode === 'password'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('phone_otp');
                  setPhoneError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginMode === 'phone_otp'
                    ? 'bg-white text-brand-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>
            </div>

            {/* Mode A: Password Login */}
            {loginMode === 'password' && (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              </div>
            )}

            {/* Mode B: Mobile OTP Login */}
            {loginMode === 'phone_otp' && (
              <div className="space-y-4">
                {phoneError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
                    {phoneError}
                  </div>
                )}

                {!phoneOtpSent ? (
                  /* Step 1: Input Phone Number */
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-brand-orange-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Instant SMS OTP via Firebase authentication</span>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneLoading || phoneNumber.length !== 10}
                      className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {phoneLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                      <span>{phoneLoading ? 'Sending SMS OTP...' : 'Send Mobile OTP'}</span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: Enter SMS OTP */
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Enter 6-Digit SMS OTP *</label>
                        {phoneTimer > 0 ? (
                          <span className="text-[10px] text-slate-400 font-bold">Resend in {phoneTimer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={phoneLoading}
                            className="text-[11px] font-bold text-brand-orange-500 hover:underline cursor-pointer"
                          >
                            Resend SMS
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 123456"
                        className="w-full text-center tracking-[8px] font-mono text-lg font-black py-2.5 bg-orange-50/50 border-2 border-orange-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-brand-orange-500"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">Sent to: +91 {phoneNumber}</span>
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          setPhoneOtp('');
                          setPhoneError('');
                        }}
                        className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Change
                      </button>
                      <button
                        type="submit"
                        disabled={phoneLoading || phoneOtp.length !== 6}
                        className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {phoneLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{phoneLoading ? 'Verifying...' : 'Verify & Login'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-orange-500 font-bold hover:underline">
            Create Free Customer Account
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
                <form onSubmit={handleSendForgotOtp} className="space-y-4">
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
                          onClick={handleSendForgotOtp}
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


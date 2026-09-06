import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Mail, RefreshCw, Smartphone, X, UserCheck, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { sendRegisterOtp, verifyOtp, verifySponsor, sendPhoneOtp, verifyPhoneOtp } from '../services/api';
import { sendFirebasePhoneOtp, clearRecaptchaVerifier } from '../config/firebase';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('return_url');

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
        return;
      }
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
  }, [user, navigate, redirectUrl]);

  // Read sponsor code from query params OR persisted browser storage
  const querySponsor =
    searchParams.get('ref') ||
    searchParams.get('sponsor') ||
    searchParams.get('sponsor_code') ||
    searchParams.get('referral') ||
    searchParams.get('code');
  const storedSponsor =
    localStorage.getItem('mediglaxo_sponsor_code') ||
    sessionStorage.getItem('mediglaxo_sponsor_code');
  const detectedSponsor = (querySponsor || storedSponsor || '').trim();

  const [hasReferral, setHasReferral] = useState(Boolean(detectedSponsor));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    sponsor_code: detectedSponsor,
    role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (phoneResendTimer > 0) {
      interval = setInterval(() => setPhoneResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  // Sync detected sponsor when query parameter or storage changes
  useEffect(() => {
    if (detectedSponsor && (!formData.sponsor_code || formData.sponsor_code !== detectedSponsor)) {
      setFormData((prev) => ({ ...prev, sponsor_code: detectedSponsor }));
      setHasReferral(true);
    }
  }, [detectedSponsor]);

  // Sponsor Verification State
  const [sponsorDetails, setSponsorDetails] = useState(null);
  const [verifyingSponsor, setVerifyingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');
  const [isAutoFilledFromLink, setIsAutoFilledFromLink] = useState(Boolean(detectedSponsor));

  // Live Sponsor Code Verification with Debounce
  useEffect(() => {
    const code = formData.sponsor_code?.trim();
    if (!code || code.length < 2) {
      setSponsorDetails(null);
      setSponsorError('');
      return;
    }

    const timer = setTimeout(async () => {
      setVerifyingSponsor(true);
      setSponsorError('');
      try {
        const res = await verifySponsor(code);
        if (res.data?.success && res.data?.sponsor) {
          setSponsorDetails(res.data.sponsor);
          setSponsorError('');
        } else {
          setSponsorDetails(null);
          setSponsorError('Sponsor code not found. Direct company assignment will apply.');
        }
      } catch (err) {
        setSponsorDetails(null);
        setSponsorError('Invalid referral code. Direct registration will apply.');
      } finally {
        setVerifyingSponsor(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.sponsor_code]);

  // Phone OTP Verification State (Hybrid Firebase + Backend SMS)
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneOtpField, setShowPhoneOtpField] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [isBackendPhoneOtp, setIsBackendPhoneOtp] = useState(false);
  const [phoneOtpStatus, setPhoneOtpStatus] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone' && phoneVerified) {
      setPhoneVerified(false);
      setShowPhoneOtpField(false);
      setPhoneOtpStatus('');
    }
  };

  const handleSendPhoneOtp = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneOtpSending(true);
    setPhoneOtpError('');
    setPhoneOtpStatus('');
    setIsBackendPhoneOtp(false);

    try {
      // 1. Verify that phone is NOT already registered in database
      const res = await sendPhoneOtp({ phone: cleanPhone, type: 'register' });
      if (!res.data?.success) {
        const msg = res.data?.message || 'This mobile number is already registered. Please log in.';
        setPhoneOtpError(msg);
        toast.error(msg);
        setPhoneOtpSending(false);
        return;
      }

      // 2. Try Firebase Phone Auth with 12-second timeout
      try {
        const firebasePromise = sendFirebasePhoneOtp(cleanPhone, 'register-recaptcha-container');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase service timed out')), 12000)
        );
        const confirmation = await Promise.race([firebasePromise, timeoutPromise]);
        setPhoneConfirmation(confirmation);
        setIsBackendPhoneOtp(false);
      } catch (fbErr) {
        console.warn('Firebase SMS unavailable, switching to backend SMS OTP service:', fbErr.message);
        setIsBackendPhoneOtp(true);
      }

      setShowPhoneOtpField(true);
      setPhoneResendTimer(60);
      setPhoneOtpStatus(`SMS OTP sent to +91 ${cleanPhone}`);
      toast.success(`SMS OTP sent to +91 ${cleanPhone}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'This mobile number is already registered with an existing account. Please log in.';
      setPhoneOtpError(msg);
      toast.error(msg);
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const handleVerifyPhoneOtp = async (cleanOtpOverride) => {
    const cleanOtp = (cleanOtpOverride || phoneOtpInput).trim();
    if (cleanOtp.length !== 6) {
      setPhoneOtpError('Please enter the 6-digit SMS OTP.');
      return;
    }
    setPhoneOtpVerifying(true);
    setPhoneOtpError('');

    let isVerified = false;

    // 1. Try Firebase Verification if confirmation exists
    if (phoneConfirmation) {
      try {
        await phoneConfirmation.confirm(cleanOtp);
        isVerified = true;
      } catch (fbErr) {
        console.warn('Firebase confirm failed in registration, checking backend OTP:', fbErr.message);
      }
    }

    // 2. If Firebase did not verify, verify with Backend OTP
    if (!isVerified) {
      try {
        const res = await verifyPhoneOtp({ phone: formData.phone, otp: cleanOtp });
        if (res.data?.success) {
          isVerified = true;
        }
      } catch (backendErr) {
        console.warn('Backend OTP verify failed in registration:', backendErr.response?.data?.message || backendErr.message);
      }
    }

    if (isVerified) {
      setPhoneVerified(true);
      setShowPhoneOtpField(false);
      setPhoneOtpStatus('Mobile number verified successfully!');
      toast.success('Mobile number verified successfully!');
    } else {
      setPhoneOtpError('Invalid or expired SMS OTP. Please check your SMS or click Resend.');
    }
    setPhoneOtpVerifying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register handleSubmit called with:', formData);
    setLoading(true);
    setError('');

    try {
      const data = await register(formData);
      console.log('Registration success data:', data);
      toast.success('Account created successfully! Welcome to MediGlaxo.');
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (data.user?.role === 'customer') {
        navigate('/shop');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration failed error:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Invisible reCAPTCHA container */}
      <div id="register-recaptcha-container"></div>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="MediGlaxo Pharma Junction" className="h-16 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Customer Account</h2>
          <p className="text-xs text-slate-400">Join thousands of customers ordering genuine medicines online</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ankit Sharma"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ankit@gmail.com (Optional)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <span className="text-[10px] text-slate-400 font-normal">(OTP Optional)</span>
              </div>
              {phoneVerified ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mobile Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={phoneOtpSending || formData.phone.length < 10}
                  className="text-[11px] font-bold text-brand-orange-500 hover:text-brand-orange-600 disabled:opacity-40 cursor-pointer flex items-center space-x-1"
                >
                  {phoneOtpSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{phoneOtpSending ? 'Sending SMS...' : 'Verify Mobile (Optional)'}</span>
                </button>
              )}
            </div>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 border rounded-r-xl text-xs focus:bg-white focus:outline-none ${
                  phoneVerified ? 'bg-emerald-50/40 border-emerald-300 font-bold' : 'bg-slate-50 border-slate-200 focus:border-brand-blue-700'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Mobile OTP verification is optional. You can skip it and create your account directly.
            </p>
          </div>

          {/* Mobile Phone OTP Verification Box */}
          {showPhoneOtpField && !phoneVerified && (
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                <span>Enter 6-Digit SMS OTP:</span>
                <div className="flex items-center space-x-2">
                  {phoneResendTimer > 0 ? (
                    <span className="text-[10px] text-slate-500 font-semibold">Resend in {phoneResendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneOtpSending}
                      className="text-[10px] text-brand-orange-600 hover:text-brand-orange-700 font-bold underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhoneOtpField(false);
                      setPhoneOtpError('');
                      setPhoneOtpStatus('');
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  maxLength={6}
                  value={phoneOtpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhoneOtpInput(val);
                    if (val.length === 6) {
                      handleVerifyPhoneOtp(val);
                    }
                  }}
                  placeholder="SMS Code"
                  className="w-2/3 px-3 py-2 bg-white border border-orange-300 rounded-xl font-mono text-center font-bold tracking-widest text-sm outline-none focus:border-brand-orange-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyPhoneOtp()}
                  disabled={phoneOtpVerifying || phoneOtpInput.length !== 6}
                  className="w-1/3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  {phoneOtpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verify</span>
                </button>
              </div>
              {phoneOtpError && <p className="text-[11px] text-rose-600 font-bold">{phoneOtpError}</p>}
              {phoneOtpStatus && <p className="text-[11px] text-emerald-700 font-semibold">{phoneOtpStatus}</p>}

              <button
                type="button"
                onClick={() => {
                  setShowPhoneOtpField(false);
                  setPhoneOtpError('');
                  setPhoneOtpStatus('');
                }}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 underline font-medium pt-1 cursor-pointer block"
              >
                Skip verification &amp; create account directly
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Create Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Referral / Sponsor Code Section */}
          <div className="pt-1 space-y-2">
            {sponsorDetails ? (
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2 shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-950 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Referral Partner</span>
                  </span>
                  <span className="text-[10px] font-mono font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                    {sponsorDetails.referral_code}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {sponsorDetails.name}
                  </h4>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    Role: <span className="font-bold">{sponsorDetails.role_name || sponsorDetails.role}</span> • Rank: <span className="font-bold">{sponsorDetails.rank || 'Partner'}</span>
                    {sponsorDetails.city && ` • ${sponsorDetails.city}, ${sponsorDetails.state || ''}`}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[10px]">
                  <span className="text-emerald-700 font-medium">
                    ✓ You will be registered under this partner's network
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, sponsor_code: '' });
                      setSponsorDetails(null);
                      setHasReferral(false);
                    }}
                    className="text-slate-400 hover:text-rose-600 font-bold underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-brand-blue-700 shrink-0" />
                    <span>Direct Registration • Assigned to Super Admin</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasReferral(!hasReferral)}
                    className="text-brand-blue-700 font-bold hover:underline text-[10px] cursor-pointer flex items-center space-x-0.5"
                  >
                    <span>{hasReferral ? 'Hide' : 'Add Referral Code'}</span>
                    {hasReferral ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {hasReferral && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="relative">
                      <input
                        type="text"
                        name="sponsor_code"
                        value={formData.sponsor_code}
                        onChange={handleChange}
                        placeholder="Enter Referral Code (e.g. RET3001)"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold focus:bg-white focus:outline-none focus:border-brand-blue-700"
                      />
                      {verifyingSponsor && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-blue-700 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {sponsorError && (
                      <p className="text-[11px] text-amber-600 font-semibold flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{sponsorError}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Create Customer Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} className="text-brand-blue-800 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}


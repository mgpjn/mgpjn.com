import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendRegisterOtp, verifyOtp } from '../services/api';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const [hasReferral, setHasReferral] = useState(Boolean(searchParams.get('ref')));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    sponsor_code: searchParams.get('ref') || '',
    role: 'customer',
  });

  // Email OTP Verification State
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpStatusMsg, setOtpStatusMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email' && emailVerified) {
      setEmailVerified(false);
      setShowOtpField(false);
      setOtpStatusMsg('');
    }
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setOtpErrorMsg('Please enter a valid email address first.');
      return;
    }
    setOtpSending(true);
    setOtpErrorMsg('');
    setOtpStatusMsg('');

    try {
      const res = await sendRegisterOtp({
        email: formData.email,
        name: formData.name || 'Valued Customer',
      });
      if (res.data.success) {
        setShowOtpField(true);
        setOtpStatusMsg(res.data.message || `Verification OTP sent to ${formData.email}`);
      }
    } catch (err) {
      setOtpErrorMsg(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (otpInput.length !== 6) {
      setOtpErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpVerifying(true);
    setOtpErrorMsg('');

    try {
      const res = await verifyOtp({
        email: formData.email,
        otp: otpInput,
      });
      if (res.data.success) {
        setEmailVerified(true);
        setShowOtpField(false);
        setOtpStatusMsg('Email verified successfully!');
      }
    } catch (err) {
      setOtpErrorMsg(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await register(formData);
      if (data.user.role === 'customer') {
        navigate('/shop');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="MediGlaxo Pharma Junction" className="h-16 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Account</h2>
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Email Address *</label>
              {emailVerified ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={otpSending || !formData.email}
                  className="text-[11px] font-bold text-brand-orange-500 hover:text-brand-orange-600 disabled:opacity-40 cursor-pointer flex items-center space-x-1"
                >
                  {otpSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{otpSending ? 'Sending...' : 'Verify Email (OTP)'}</span>
                </button>
              )}
            </div>
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ankit@gmail.com"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:bg-white focus:outline-none ${
                emailVerified ? 'bg-emerald-50/40 border-emerald-300 font-medium' : 'bg-slate-50 border-slate-200 focus:border-brand-blue-700'
              }`}
            />
          </div>

          {/* OTP Verification Box */}
          {showOtpField && !emailVerified && (
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                <span>Enter 6-Digit Email OTP:</span>
                <span className="text-[10px] text-orange-700">Sent via no-reply@mgpjn.com</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit OTP"
                  className="w-2/3 px-3 py-2 bg-white border border-orange-300 rounded-xl font-mono text-center font-bold tracking-widest text-sm outline-none focus:border-brand-orange-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={otpVerifying || otpInput.length !== 6}
                  className="w-1/3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer"
                >
                  {otpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verify</span>
                </button>
              </div>
              {otpErrorMsg && <p className="text-[11px] text-rose-600 font-bold">{otpErrorMsg}</p>}
              {otpStatusMsg && <p className="text-[11px] text-emerald-700 font-semibold">{otpStatusMsg}</p>}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Create Password *</label>
            <input
              type="password"
              required
              minLength="6"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setHasReferral(!hasReferral)}
              className="text-[11px] font-semibold text-brand-blue-700 hover:underline flex items-center space-x-1"
            >
              <span>Have a referral / partner code? (Optional)</span>
              {hasReferral ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {hasReferral && (
              <div className="mt-2">
                <input
                  type="text"
                  name="sponsor_code"
                  value={formData.sponsor_code}
                  onChange={handleChange}
                  placeholder="e.g. MG1001"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono focus:bg-white focus:outline-none focus:border-brand-blue-700"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-blue-800 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

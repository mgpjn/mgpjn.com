import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Mail, RefreshCw, Smartphone, X, UserCheck, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { verifySponsor } from '../services/api';

export const INDIAN_STATES_WITH_CODES = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Puducherry', code: '34' },
];

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('return_url');

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
    business_name: '',
    email: '',
    phone: '',
    password: '',
    state: 'Gujarat',
    state_code: '24',
    city: '',
    pincode: '',
    address: '',
    gst_number: '',
    drug_license_no: '',
    sponsor_code: detectedSponsor,
    role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await register(formData);
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
              Email Address *
            </label>
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ankit@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
            <input aria-label="Mobile Number" type="tel" name="phone" required pattern="[0-9]{10}" maxLength={10} autoComplete="tel-national" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            <p className="text-[11px] text-slate-500 mt-1">Instant account creation. Set up your login PIN after signup.</p>
          </div>

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

          {/* State Selection & GST Type Preview */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">State / Province *</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  formData.state_code === '24' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {formData.state_code === '24' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </span>
              </div>
              <select
                name="state"
                value={formData.state}
                onChange={(e) => {
                  const sName = e.target.value;
                  const sObj = INDIAN_STATES_WITH_CODES.find((s) => s.name === sName);
                  setFormData((prev) => ({
                    ...prev,
                    state: sName,
                    state_code: sObj?.code || '24',
                  }));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-brand-blue-700"
              >
                {INDIAN_STATES_WITH_CODES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City / Town</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Surat"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  name="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 394230"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-brand-blue-700"
                />
              </div>
            </div>

            {/* Optional Business / Pharmacy Compliance Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">GSTIN (Optional)</label>
                  {formData.gst_number && formData.gst_number.length === 15 && (
                    <span className={`text-[9px] font-bold ${
                      formData.gst_number.substring(0, 2) === formData.state_code ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formData.gst_number.substring(0, 2) === formData.state_code ? '✓ State Code Matches' : `⚠️ Must start with ${formData.state_code}`}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={15}
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  placeholder="24ABVFM0075D1ZA"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:border-brand-blue-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Drug License (Optional)</label>
                <input
                  type="text"
                  name="drug_license_no"
                  value={formData.drug_license_no}
                  onChange={handleChange}
                  placeholder="GJ-SUR-215010"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-700"
                />
              </div>
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

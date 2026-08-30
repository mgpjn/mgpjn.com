import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, Phone, Mail, MapPin, Building, CreditCard, Lock, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.data.success) {
          const u = res.data.user;
          setFormData({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            city: u.city || '',
            state: u.state || '',
            pincode: u.pincode || '',
            pan_number: u.pan_number || '',
            bank_name: u.bank_name || '',
            account_number: u.account_number || '',
            ifsc_code: u.ifsc_code || '',
            upi_id: u.upi_id || '',
            password: '',
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await updateProfile(formData);
      if (res.data.success) {
        setMessage('Profile & KYC details updated successfully!');
        if (updateUser) updateUser(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account &amp; KYC Settings</h1>
        <p className="text-xs text-slate-500">Manage your contact details, shipping address, and Refer & Earn payout bank accounts.</p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Wallet Overview Card */}
      {user && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
              <Wallet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">MediGlaxo Wallet Balance</span>
              <div className="text-2xl sm:text-3xl font-black text-white">₹{(user.wallet_balance || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/wallet"
              className="px-4 py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <span>Passbook &amp; Withdraw (Min ₹500)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <User className="w-4 h-4 text-brand-blue-700" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-brand-orange-500" />
            <span>Default Delivery Address</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House/Flat No., Road, Landmark"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Refer & Earn Payout & Banking Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Banking &amp; UPI Details (For Commission Payouts)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Number</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                placeholder="50100234567890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                placeholder="HDFC0000123"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl uppercase font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleChange}
                placeholder="yourname@okhdfcbank"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PAN Card Number</label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl uppercase font-mono"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-slate-600" />
            <span>Security (Leave blank to keep unchanged)</span>
          </h3>

          <div className="text-xs max-w-sm">
            <label className="font-bold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-brand-blue-800/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save Profile & Settings'}
        </button>
      </form>
    </div>
  );
}

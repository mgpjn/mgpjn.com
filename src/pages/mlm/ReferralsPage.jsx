import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Award, Copy, Check, ArrowLeft, Percent } from 'lucide-react';
import { getDirectReferrals } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getDirectReferrals()
      .then((res) => {
        if (res.data.success) {
          setReferrals(res.data.referrals.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referral_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/mlm" className="text-xs font-bold text-brand-blue-800 hover:underline flex items-center space-x-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Referral Income Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Direct Referrals (Stage 1)</h1>
            <span className="bg-orange-50 text-[#ff5722] text-xs font-black px-2.5 py-0.5 rounded-full">
              15% Referral Income
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Directly sponsored partners registered with your referral code {user?.referral_code}.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search downline name, code..."
            className="px-3.5 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-700 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Partner / Customer</th>
              <th className="p-3">Referral Code</th>
              <th className="p-3">Role / Level</th>
              <th className="p-3">Joined Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-slate-400">
                  {loading ? 'Loading referrals...' : 'No direct referrals found.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">
                    {r.name}
                    <span className="text-[11px] text-slate-400 font-normal block">{r.phone}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-[#ff5722]">{r.referral_code}</td>
                  <td className="p-3 font-semibold text-slate-700 capitalize">
                    {r.role ? r.role.replace('_', ' ') : 'Customer'}
                  </td>
                  <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Filter } from 'lucide-react';
import { getMlmCommissions } from '../../services/api';

export default function CommissionsLedger() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all');

  useEffect(() => {
    getMlmCommissions()
      .then((res) => {
        if (res.data.success) {
          setCommissions(res.data.commissions.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = commissions.filter((c) => {
    if (selectedStage === 'all') return true;
    return c.level === parseInt(selectedStage);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/mlm" className="text-xs font-bold text-brand-blue-800 hover:underline flex items-center space-x-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Referral Income Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Referral Income Audit Ledger</h1>
          <p className="text-xs text-slate-500">
            Statement of 3-Stage referral income: Stage 1 (15%), Stage 2 (3%), Stage 3 (2%).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-500">Filter Stage:</span>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All 3 Stages</option>
            <option value="1">Stage 1 (15% Direct)</option>
            <option value="2">Stage 2 (3% Team)</option>
            <option value="3">Stage 3 (2% Network)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Stage &amp; Income Rate</th>
              <th className="p-3">Purchased By</th>
              <th className="p-3">Order Number</th>
              <th className="p-3 text-right">Referral Income</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-slate-400">
                  {loading ? 'Loading ledger...' : 'No referral income records found.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="p-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                      c.level === 1 ? 'bg-orange-50 text-[#ff5722]' :
                      c.level === 2 ? 'bg-blue-50 text-blue-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      Stage {c.level} ({c.percentage}%)
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{c.from_user?.name || 'Customer'}</td>
                  <td className="p-3 font-mono text-slate-500">#{c.order?.order_number}</td>
                  <td className="p-3 text-right font-black text-emerald-600 text-sm">
                    +₹{c.commission_amount.toFixed(2)}
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

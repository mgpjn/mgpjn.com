import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { getWalletTransactions, requestPayout } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function WalletPayouts() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Payout Form
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadWallet = () => {
    getWalletTransactions()
      .then((res) => {
        if (res.data.success) {
          setTransactions(res.data.transactions?.data || []);
          setBalance(res.data.balance || 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) < 500) {
      setError('Minimum payout amount is ₹500.');
      return;
    }
    if (parseFloat(amount) > balance) {
      setError('Amount exceeds your current wallet balance.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await requestPayout({
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        account_details: accountDetails,
      });

      if (res.data.success) {
        setMessage('Payout withdrawal request submitted successfully!');
        setAmount('');
        setAccountDetails('');
        loadWallet();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Distributor Wallet &amp; Payouts</h1>
          <p className="text-xs text-slate-500">Manage earnings, view commission ledgers and request bank withdrawals.</p>
        </div>
        <Link to="/mlm" className="text-xs font-bold text-brand-blue-800 hover:underline">
          Back to Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Request Payout Box */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="bg-gradient-to-tr from-brand-blue-900 to-brand-blue-700 rounded-2xl p-6 text-white space-y-2">
            <span className="text-xs text-blue-200 uppercase font-bold">Current Withdrawable Balance</span>
            <div className="text-3xl font-black">₹{balance.toFixed(2)}</div>
            <p className="text-[11px] text-blue-100">Directly withdrawable to any Indian Bank Account or UPI.</p>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Request Payout / Withdrawal</h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                min="500"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min ₹500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">5% TDS/Processing fee applies.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Transfer Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-2.5 rounded-xl border text-center cursor-pointer text-xs font-bold ${
                  paymentMethod === 'bank_transfer' ? 'bg-brand-blue-800 text-white' : 'bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="pm"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="hidden"
                  />
                  Bank Transfer (NEFT/IMPS)
                </label>

                <label className={`p-2.5 rounded-xl border text-center cursor-pointer text-xs font-bold ${
                  paymentMethod === 'upi' ? 'bg-brand-blue-800 text-white' : 'bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="pm"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="hidden"
                  />
                  UPI ID (VPA)
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {paymentMethod === 'bank_transfer' ? 'Bank Account Details *' : 'UPI ID (e.g. name@okhdfcbank) *'}
              </label>
              <textarea
                required
                rows="3"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder={
                  paymentMethod === 'bank_transfer'
                    ? 'Bank Name:\nA/C Number:\nIFSC Code:\nA/C Holder Name:'
                    : 'yourname@upi'
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600 font-mono"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Wallet Transaction History</h3>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No wallet transactions found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {tx.type === 'credit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{tx.description}</span>
                      <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-black text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Bal: ₹{tx.balance_after.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

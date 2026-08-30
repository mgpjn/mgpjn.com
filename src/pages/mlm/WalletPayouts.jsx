import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle,
  Building2, QrCode, CreditCard, Filter, RefreshCw, Sparkles, ArrowLeft, Download
} from 'lucide-react';
import { exportPassbookReport } from '../../utils/excelExport';
import { getWalletTransactions, requestPayout } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function WalletPayouts() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  // Payout Form
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Prefill default account details from profile if empty
  useEffect(() => {
    if (!accountDetails && user) {
      if (paymentMethod === 'bank_transfer' && (user.account_number || user.bank_name)) {
        setAccountDetails(
          `Bank: ${user.bank_name || 'N/A'}\nA/C: ${user.account_number || ''}\nIFSC: ${user.ifsc_code || ''}\nName: ${user.name || ''}`.trim()
        );
      } else if (paymentMethod === 'upi' && user.upi_id) {
        setAccountDetails(user.upi_id);
      }
    }
  }, [user, paymentMethod]);

  const loadWallet = () => {
    setLoading(true);
    getWalletTransactions()
      .then((res) => {
        if (res.data?.success) {
          setTransactions(res.data.transactions?.data || res.data.transactions || []);
          setBalance(res.data.balance !== undefined ? parseFloat(res.data.balance) : 0);
        }
      })
      .catch((err) => console.error('Failed to load wallet transactions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      setError('Minimum withdrawal amount is ₹500. Amounts less than ₹500 cannot be requested.');
      return;
    }
    if (withdrawAmount > balance) {
      setError(`Requested amount (₹${withdrawAmount}) exceeds your available wallet balance (₹${balance.toFixed(2)}).`);
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await requestPayout({
        amount: withdrawAmount,
        payment_method: paymentMethod,
        account_details: accountDetails,
      });

      if (res.data?.success) {
        setMessage('Withdrawal request of ₹' + withdrawAmount.toFixed(2) + ' submitted successfully! Funds will be credited after admin review.');
        setAmount('');
        loadWallet();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'credit') return tx.type === 'credit';
    if (filterCategory === 'debit') return tx.type === 'debit';
    if (filterCategory === 'order_payment') return tx.category === 'order_payment' || tx.description?.toLowerCase().includes('order');
    if (filterCategory === 'payout') return tx.category === 'payout_withdrawal' || tx.description?.toLowerCase().includes('payout');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Wallet &amp; Passbook
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-brand-blue-50 text-brand-blue-800 border border-brand-blue-200">
              {user?.role?.replace('_', ' ') || 'Partner'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time wallet balance, detailed transaction ledger, and instant bank/UPI withdrawal desk (Min ₹500).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadWallet}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/shop"
            className="px-4 py-2 bg-brand-blue-800 hover:bg-brand-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1"
          >
            <span>Shop with Wallet</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards with Opening Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-tr from-brand-blue-950 via-brand-blue-900 to-brand-blue-800 rounded-3xl p-6 text-white space-y-3 shadow-lg shadow-brand-blue-900/20 relative overflow-hidden animate-card-in-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">Available Wallet Balance</span>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ₹{balance.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-blue-200 pt-2 border-t border-white/10">
            <span>Usable at Checkout &amp; Withdrawable</span>
            <span className="font-bold text-emerald-300">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3 animate-card-in-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider">Total Earnings / Turnover</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            ₹{(user?.total_earned || balance).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Referral commissions + network profit</span>
            <span className="font-bold text-slate-600">{user?.rank || 'Associate'}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3 sm:col-span-2 lg:col-span-1 animate-card-in-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider">Withdrawal Policy</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
            Minimum ₹500
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
            Withdrawal requests of ₹500 or more are processed via NEFT / IMPS or direct UPI transfer.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Request Form, Right Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Request Withdrawal */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-brand-blue-800" />
              <span>Request Payout / Withdrawal</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Minimum withdrawal amount is <strong>₹500</strong>. Enter your desired amount and payout details.
            </p>
          </div>

          {message && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {balance < 500 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Minimum Balance Notice:</strong>
                <span>You currently have ₹{balance.toFixed(2)}. You can request a withdrawal once your balance reaches ₹500 or more.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                min="500"
                step="1"
                required
                placeholder="Min. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black focus:outline-none focus:border-brand-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Payout Transfer Method *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-brand-blue-800 bg-brand-blue-50/50 text-brand-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Bank Transfer (NEFT/IMPS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand-blue-800 bg-brand-blue-50/50 text-brand-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-xs font-bold">UPI / VPA</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {paymentMethod === 'bank_transfer' ? 'Bank Account Details *' : 'UPI ID / VPA *'}
              </label>
              {paymentMethod === 'bank_transfer' ? (
                <textarea
                  rows="3"
                  required
                  placeholder="Bank Name, Account Number, IFSC Code, Account Holder Name"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-blue-600 font-mono"
                />
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. mobile@upi, username@okhdfcbank"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-blue-600"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || balance < 500}
              className="w-full py-3 bg-brand-blue-800 hover:bg-brand-blue-900 text-white rounded-xl text-xs font-black shadow-md shadow-brand-blue-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* Right: Passbook / Transaction History */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Wallet Passbook &amp; Ledger</h3>
              <p className="text-xs text-slate-400">Chronological history of all credits, order payments &amp; withdrawals.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => exportPassbookReport(transactions, balance, user)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                title="Download Official MediGlaxo Passbook Statement in Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement (Excel)</span>
              </button>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterCategory === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('credit')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterCategory === 'credit' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'}`}
                >
                  Credits (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('debit')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterCategory === 'debit' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'}`}
                >
                  Debits (-)
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading wallet ledger...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No transactions found in this category.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3 min-w-0 pr-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 truncate block">{tx.description}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            tx.category === 'order_payment' ? 'bg-blue-100 text-blue-800' :
                            tx.category === 'payout_withdrawal' ? 'bg-purple-100 text-purple-800' :
                            tx.category === 'wallet_refund' ? 'bg-amber-100 text-amber-800' :
                            isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.category?.replace('_', ' ') || tx.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`font-black text-sm block ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? '+' : '-'}₹{Number(tx.amount || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Bal: ₹{Number(tx.balance_after || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

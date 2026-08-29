import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Users, Network, TrendingUp, Copy, Check, QrCode,
  ArrowUpRight, ArrowDownRight, Award, ShieldCheck, ChevronRight, Share2,
  Layers, Percent, Sparkles, Building2, Store, MapPin, UserCheck, ShoppingBag,
  Clock, CheckCircle, Package, ArrowRight, HelpCircle, FileText, Truck, Printer
} from 'lucide-react';
import { getMlmDashboard, updateDeliveryStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';

export default function MlmDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState(null);

  const loadDashboard = () => {
    getMlmDashboard()
      .then((res) => {
        if (res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const referralCode = user?.referral_code || 'MG1001';
  const referralLink = `${window.location.origin}/register?sponsor=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Join MediGlaxo Pharma Junction referral program using my code ${referralCode} and earn Stage 1 (15%), Stage 2 (3%), and Stage 3 (2%) referral income! Register here: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingDeliveryId(orderId);
    try {
      await updateDeliveryStatus(orderId, { local_delivery_status: newStatus });
      loadDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDeliveryId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="w-48 h-8 bg-slate-200 rounded-xl mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-100 h-32 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const customerOrders = data?.customer_orders || [];

  const ROLE_LEVEL_LOOKUP = {
    super_admin: 10,
    admin: 9,
    super_distributor: 8,
    distributor: 7,
    sub_distributor: 6,
    retailer: 5,
    sub_retailer: 4,
    customer: 3,
    customer_1: 3,
    customer_2: 2,
    customer_3: 1,
  };

  const FULL_HIERARCHY_CHAIN = [
    { key: 'super_admin', level: 10, rank: 'Super Admin', desc: 'Platform Owner', icon: ShieldCheck, color: 'bg-rose-500', stepNo: '#01' },
    { key: 'admin', level: 9, rank: 'Admin', desc: 'Head Office', icon: Building2, color: 'bg-indigo-600', stepNo: '#02' },
    { key: 'super_distributor', level: 8, rank: 'Super Distributor', desc: 'State / C&F', icon: Building2, color: 'bg-blue-600', stepNo: '#03' },
    { key: 'distributor', level: 7, rank: 'Distributor', desc: 'District Wholesaler', icon: Store, color: 'bg-cyan-600', stepNo: '#04' },
    { key: 'sub_distributor', level: 6, rank: 'Sub Distributor', desc: 'Area Stockist', icon: Store, color: 'bg-teal-600', stepNo: '#05' },
    { key: 'retailer', level: 5, rank: 'Retailer (Chemist)', desc: 'Pharmacy Chemist', icon: Store, color: 'bg-emerald-600', stepNo: '#06' },
    { key: 'sub_retailer', level: 4, rank: 'Sub Retailer (Pincode & Local)', desc: 'Local Executive (Income Starts)', icon: MapPin, color: 'bg-[#ff5722]', stepNo: '#07' },
    { key: 'customer_1', level: 3, rank: 'Customer 1', desc: 'Direct Referral (Stage 1)', icon: Users, color: 'bg-purple-600', stepNo: '#08' },
    { key: 'customer_2', level: 2, rank: 'Customer 2', desc: 'Level 2 (Stage 2)', icon: Users, color: 'bg-pink-600', stepNo: '#09' },
    { key: 'customer_3', level: 1, rank: 'Customer 3', desc: 'Level 3 (Stage 3)', icon: Users, color: 'bg-amber-600', stepNo: '#10' },
  ];

  const currentRole = user?.role || stats?.role || 'sub_retailer';
  const currentUserLevel = ROLE_LEVEL_LOOKUP[currentRole] ?? 4;
  // Strict rule: jo jis post pe hai usko uske neeche wala ka data hi show hoga
  const visibleHierarchyChain = FULL_HIERARCHY_CHAIN.filter((step) => step.level < currentUserLevel);

  const REFERRAL_RULES_EXAMPLES = [
    {
      title: 'Customer 1 Buys a Product',
      desc: 'Order placed by directly referred Customer 1',
      payout: '15% to Sub Retailer',
      color: 'border-l-[#ff5722] bg-orange-50/50',
      badge: '15% Stage 1',
    },
    {
      title: 'Customer 2 Buys a Product',
      desc: 'Referred by Customer 1 under Sub Retailer',
      payout: '15% to Customer 1 + 3% to Sub Retailer',
      color: 'border-l-blue-600 bg-blue-50/50',
      badge: '15% + 3% (Stage 1 & 2)',
    },
    {
      title: 'Customer 3 Buys a Product',
      desc: 'Referred by Customer 2 under Customer 1',
      payout: '15% to Customer 2 + 3% to Customer 1 + 2% to Sub Retailer',
      color: 'border-l-purple-600 bg-purple-50/50',
      badge: '15% + 3% + 2% (3 Stages)',
    },
    {
      title: 'Customer 4 Buys a Product',
      desc: 'Referred by Customer 3 under Customer 2',
      payout: '15% to Customer 3 + 3% to Customer 2 + 2% to Customer 1',
      color: 'border-l-emerald-600 bg-emerald-50/50',
      badge: 'Rolling 3-Level Chain',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Shareable Referral Banner */}
      <div className="bg-gradient-to-r from-brand-blue-950 via-brand-blue-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-orange-400 uppercase tracking-widest flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Referral Income Partner Portal</span>
            </span>
            <span className="bg-[#ff5722] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {stats.role ? stats.role.replace('_', ' ') : 'Sub Retailer'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{user?.name}</h1>
          <p className="text-xs text-slate-300">
            Sponsor / Referral Code: <strong className="text-brand-orange-300 font-mono text-sm">{referralCode}</strong>
          </p>
        </div>

        {/* Shareable Referral Link & WhatsApp Share */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 max-w-md w-full space-y-2.5">
          <span className="text-[11px] font-bold text-slate-200 block">Your Unique Referral Invite Link:</span>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full bg-black/30 text-white text-xs px-3 py-2.5 rounded-xl font-mono focus:outline-none border border-white/10"
            />
            <button
              onClick={handleCopy}
              className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all flex-shrink-0 shadow-md cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Invite on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 3-Stage Referral Income Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-[#ff5722] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase">Stage 1 (Direct Referral)</span>
            <span className="bg-orange-50 text-[#ff5722] text-xs font-black px-2.5 py-0.5 rounded-full">15% Income</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{stats.stage1_earnings?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400">15% instant commission from all directly referred Customer 1 orders.</p>
        </div>

        {/* Stage 2 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase">Stage 2 (Team Referral)</span>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full">3% Income</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{stats.stage2_earnings?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400">3% team override commission from 2nd-level Customer 2 orders.</p>
        </div>

        {/* Stage 3 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-purple-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase">Stage 3 (Network Referral)</span>
            <span className="bg-purple-50 text-purple-700 text-xs font-black px-2.5 py-0.5 rounded-full">2% Income</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{stats.stage3_earnings?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400">2% network growth bonus from 3rd-level Customer 3 orders.</p>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Withdrawable Wallet Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{stats.wallet_balance?.toFixed(2) || '0.00'}
          </div>
          <Link to="/mlm/wallet" className="text-xs font-extrabold text-emerald-600 hover:underline flex items-center space-x-1">
            <span>Request Bank Payout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Lifetime Income</span>
            <div className="w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-blue-900">
            ₹{stats.total_earned?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[10px] text-slate-400 block">3-Stage referral commissions</span>
        </div>

        {/* Direct Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Direct Referrals (Stage 1)</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.direct_referrals_count || 0} Members
          </div>
          <span className="text-[10px] text-slate-400 block">Earning 15% direct bonus</span>
        </div>

        {/* Total Downline Customer Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Downline Customer Orders</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {customerOrders.length || stats.customer_orders_count || 0} Orders
          </div>
          <span className="text-[10px] text-purple-600 font-bold block">Generating referral revenue</span>
        </div>
      </div>

      {/* 4-Card Visual Guide: How Referral Income Is Shared */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-[#ff5722]" />
              <span>How 3-Stage Referral Income Is Shared (कमीशन शेयरिंग नियम)</span>
            </h3>
            <p className="text-xs text-slate-500">
              हर आर्डर का कमीशन 3 स्तरों में 15%, 3% और 2% के रूप में ऑटोमैटिकली बंटता है:
            </p>
          </div>
          <span className="text-[10px] font-black uppercase text-[#ff5722] bg-orange-50 px-2.5 py-1 rounded-full">
            Stage 1: 15% | Stage 2: 3% | Stage 3: 2%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {REFERRAL_RULES_EXAMPLES.map((ex, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border-l-4 border ${ex.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Rule #{idx + 1}</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white text-slate-800 shadow-xs border">
                  {ex.badge}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">{ex.title}</h4>
              <p className="text-[11px] text-slate-500">{ex.desc}</p>
              <div className="pt-2 border-t border-black/5">
                <span className="text-[11px] font-black text-slate-900 block">Payout Distribution:</span>
                <span className="text-[11px] font-bold text-emerald-700">{ex.payout}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MY CUSTOMER ORDERS TABLE & GST INVOICE DOWNLOAD */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-brand-blue-800" />
              <span>Downline Customer Orders &amp; Local Deliveries (लोकल कस्टमर ऑर्डर्स)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Orders placed by your Customer 1, 2, and 3 downlines with instant GST Invoice and delivery status controls.
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            Showing {customerOrders.length} Recent Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">ORDER ID</th>
                <th className="p-3">CUSTOMER &amp; PINCODE</th>
                <th className="p-3">STAGE &amp; RATE</th>
                <th className="p-3">ORDER TOTAL</th>
                <th className="p-3 font-bold text-emerald-700">YOUR COMMISSION</th>
                <th className="p-3">DELIVERY STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No customer orders placed yet. Share your invite link to start earning!
                  </td>
                </tr>
              ) : (
                customerOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-blue-800">
                      {ord.order_number}
                      <span className="text-[10px] text-slate-400 block font-normal">{ord.created_at}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{ord.customer_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ord.phone} • {ord.city} ({ord.pincode})</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ord.stage === 1 ? 'bg-orange-50 text-[#ff5722]' :
                        ord.stage === 2 ? 'bg-blue-50 text-blue-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        Stage {ord.stage} ({ord.rate}%)
                      </span>
                    </td>
                    <td className="p-3 font-black text-slate-900">
                      ₹{ord.total_amount.toFixed(2)}
                    </td>
                    <td className="p-3 font-black text-emerald-600 text-sm">
                      +₹{ord.commission_earned.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ord.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          ord.order_status === 'dispatched' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {ord.order_status}
                        </span>
                        
                        {/* Sub-Retailer Delivery Action dropdown */}
                        {ord.order_status !== 'delivered' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, ord.order_status === 'dispatched' ? 'delivered' : 'out_for_delivery')}
                            disabled={updatingDeliveryId === ord.id}
                            className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer"
                          >
                            {updatingDeliveryId === ord.id ? 'Updating...' : (ord.order_status === 'dispatched' ? 'Mark Delivered' : 'Out for Delivery')}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {/* View & Download GST Invoice Button */}
                      <button
                        onClick={() => setSelectedInvoiceOrderId(ord.id)}
                        className="bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-900 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ml-auto transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-orange-500" />
                        <span>GST Bill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subordinate Downline Hierarchy Roadmap */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-slate-900 text-sm">Official Downline Hierarchy &amp; Referral Chain</h3>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                Your Post: {currentRole.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Only subordinate downline roles &amp; referral channels under your post are displayed.
            </p>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
            Stage 1: 15% • Stage 2: 3% • Stage 3: 2%
          </span>
        </div>

        {visibleHierarchyChain.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {visibleHierarchyChain.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 relative group hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400">{step.stepNo}</span>
                    <div className={`w-6 h-6 rounded-lg ${step.color} text-white flex items-center justify-center text-[10px]`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{step.rank}</h4>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
            You are at Customer 3 level. Your direct referral link invites new customers to MediGlaxo!
          </div>
        )}
      </div>

      {/* GST Invoice Modal */}
      {selectedInvoiceOrderId && (
        <GstInvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}
    </div>
  );
}

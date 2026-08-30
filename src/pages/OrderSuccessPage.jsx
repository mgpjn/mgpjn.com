import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Phone, FileText, Printer, Clock, Store, Calendar } from 'lucide-react';
import GstInvoiceModal from '../components/invoice/GstInvoiceModal';
import { getOrderDeliveryTiming } from '../data/deliveryTiming';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const order = location.state?.order;
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const orderId = order?.id || id;
  const orderNumber = order?.order_number || id;
  const timingInfo = getOrderDeliveryTiming(order);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md shadow-emerald-100">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
          Thank you for choosing MediGlaxo Pharma Junction
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="text-xs text-slate-500 mt-2">
          {timingInfo.isTakeaway
            ? `Your order #${orderNumber} is confirmed and sent to the local pharmacy hub for packing.`
            : `Your order #${orderNumber} is confirmed and routed for express doorstep delivery.`}
        </p>
      </div>

      {/* Prominent Estimated Delivery / Takeaway Timing Card */}
      <div className={`max-w-md mx-auto p-5 rounded-3xl border text-left space-y-3 shadow-sm ${
        timingInfo.isTakeaway
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-emerald-200'
          : 'bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
            timingInfo.isTakeaway
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {timingInfo.isTakeaway ? '🏬 Store Takeaway' : '🚚 Home Delivery'}
          </span>
          <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{timingInfo.tag}</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {timingInfo.isTakeaway ? 'Takeaway Pickup Window' : 'Guaranteed Delivery Timing'}
          </span>
          <h3 className={`text-lg font-black tracking-tight ${
            timingInfo.isTakeaway ? 'text-emerald-950' : 'text-slate-900'
          }`}>
            {timingInfo.timingTitle}
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {timingInfo.instruction}
          </p>
        </div>

        {timingInfo.isTakeaway ? (
          <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs text-emerald-900 font-bold">
            <span>Counter Pickup Timing:</span>
            <span className="font-mono font-black">{timingInfo.pickupWindow}</span>
          </div>
        ) : (
          <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-xs text-blue-950 font-bold">
            <span>Express Delivery Slot:</span>
            <span className="font-mono font-black">{timingInfo.subText}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left max-w-md mx-auto space-y-4 text-xs">
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">Order ID</span>
          <span className="font-bold text-slate-800 font-mono">{orderNumber}</span>
        </div>
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">Payment &amp; Order Mode</span>
          <span className="font-bold text-slate-800 uppercase">
            {order?.payment_method === 'takeaway' ? 'Store Takeaway' : (order?.payment_method || 'Online')}
          </span>
        </div>
        {order?.assigned_sub_retailer && (
          <div className="flex justify-between pb-3 border-b">
            <span className="text-slate-400">Local Pharmacy Hub</span>
            <span className="font-bold text-emerald-700">{order.assigned_sub_retailer.name} ({order.assigned_sub_retailer.pincode})</span>
          </div>
        )}
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">{timingInfo.isTakeaway ? 'Ready for Pickup' : 'Estimated Delivery'}</span>
          <span className="font-bold text-emerald-600">{timingInfo.timingTitle}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-brand-blue-900">
          <span>Amount {order?.payment_method === 'cod' || order?.payment_method === 'takeaway' ? 'Payable' : 'Paid'}</span>
          <span>₹{order?.total_amount ? Number(order.total_amount).toFixed(2) : 'Paid'}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        {/* Download GST Invoice */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Download GST Invoice (PDF)</span>
        </button>

        <Link
          to={`/track-order?order=${orderNumber}`}
          className="bg-brand-blue-800 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-brand-blue-900 flex items-center space-x-2"
        >
          <Truck className="w-4 h-4" />
          <span>Live Order Tracking</span>
        </Link>

        <Link
          to="/shop"
          className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-3 rounded-xl text-xs font-bold"
        >
          Continue Shopping
        </Link>
      </div>

      {showInvoiceModal && orderId && (
        <GstInvoiceModal
          orderId={orderId}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}

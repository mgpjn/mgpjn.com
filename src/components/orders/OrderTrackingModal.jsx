import React, { useState } from 'react';
import { X, Truck, ExternalLink, Copy, Check, MapPin, Calendar, Clock, PackageCheck, ShieldCheck, Store } from 'lucide-react';
import { getOrderDeliveryTiming } from '../../data/deliveryTiming';

export default function OrderTrackingModal({ order, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyTrackingNumber = () => {
    if (order.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDispatched = order.order_status === 'dispatched' || order.order_status === 'delivered';
  const isDelivered = order.order_status === 'delivered';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center text-brand-blue-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900">
                  Live Order Tracking
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {order.order_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Order #{order.order_number} {order.invoice_number ? `• ${order.invoice_number}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estimated Delivery / Takeaway Timing Card */}
        {(() => {
          const timingInfo = getOrderDeliveryTiming(order);
          return (
            <div className={`p-4 rounded-2xl border text-left space-y-2 ${
              timingInfo.isTakeaway
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {timingInfo.isTakeaway ? (
                    <Store className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Truck className="w-4 h-4 text-blue-700" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                    {timingInfo.isTakeaway ? '🏬 Takeaway Pickup Timing' : '🚚 Estimated Delivery Timing'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {timingInfo.tag}
                </span>
              </div>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <span className={`text-base font-black ${timingInfo.isTakeaway ? 'text-emerald-950' : 'text-slate-900'}`}>
                  {order.order_status === 'delivered' ? '✓ Delivered' : timingInfo.timingTitle}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {timingInfo.isTakeaway ? timingInfo.pickupWindow : timingInfo.subText}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {timingInfo.instruction}
              </p>
            </div>
          );
        })()}

        {/* Courier & Tracking Details Card */}
        {order.tracking_number || order.courier_name ? (
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-300/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                📦 Shipment Dispatched via
              </span>
              <span className="text-xs font-black text-emerald-950 px-2.5 py-0.5 rounded-lg bg-white shadow-2xs border border-emerald-200">
                {order.courier_name || 'Express Courier'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-emerald-200 shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Tracking / AWB Number</span>
                <span className="text-sm font-black font-mono text-slate-900 tracking-wide select-all">
                  {order.tracking_number || 'N/A'}
                </span>
              </div>
              {order.tracking_number && (
                <button
                  onClick={handleCopyTrackingNumber}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1 border border-slate-200 transition-colors cursor-pointer"
                  title="Copy Tracking ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Direct Tracking Link on Courier Website */}
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer text-center"
              >
                <span>Track on {order.courier_name || 'Courier'} Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Shipment Preparation in Progress</span>
            <p className="text-[11px] text-amber-700">
              Your medicine order is currently packed at the central warehouse and awaiting courier dispatch assignment.
            </p>
          </div>
        )}

        {/* Live Step Tracker */}
        <div className="space-y-3 pt-2">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
            Shipment Journey
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Order Placed */}
            <div className="relative flex items-start space-x-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                ✓
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">Order Confirmed &amp; Placed</span>
                <span className="text-[11px] text-slate-400">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'Order verified'}
                </span>
              </div>
            </div>

            {/* Step 2: Packed */}
            <div className="relative flex items-start space-x-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                ✓
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">Quality Checked &amp; Packed</span>
                <span className="text-[11px] text-slate-400">Verified by Registered Pharmacist</span>
              </div>
            </div>

            {/* Step 3: Dispatched */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                isDispatched ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isDispatched ? '✓' : '3'}
              </div>
              <div>
                <span className={`font-extrabold text-xs block ${isDispatched ? 'text-emerald-950' : 'text-slate-500'}`}>
                  Handed Over to Courier ({order.courier_name || 'In Transit'})
                </span>
                <span className="text-[11px] text-slate-400">
                  {order.dispatched_at
                    ? `Dispatched on ${new Date(order.dispatched_at).toLocaleString()}`
                    : (isDispatched ? 'Package in transit with courier partner' : 'Awaiting handover')}
                </span>
              </div>
            </div>

            {/* Step 4: Out for Delivery */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                isDelivered ? 'bg-emerald-600 text-white' : (isDispatched ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500')
              }`}>
                {isDelivered ? '✓' : '4'}
              </div>
              <div>
                <span className={`font-extrabold text-xs block ${isDispatched ? 'text-slate-900' : 'text-slate-500'}`}>
                  Out for Delivery
                </span>
                <span className="text-[11px] text-slate-400">
                  Destination Hub: {order.city} ({order.pincode})
                </span>
              </div>
            </div>

            {/* Step 5: Delivered */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isDelivered ? '✓' : '5'}
              </div>
              <div>
                <span className={`font-extrabold text-xs block ${isDelivered ? 'text-emerald-950' : 'text-slate-500'}`}>
                  Delivered Successfully
                </span>
                <span className="text-[11px] text-slate-400">
                  {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : 'Pending final doorstep delivery'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address Details */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs space-y-1">
          <span className="font-bold text-slate-800 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Delivery Destination:</span>
          </span>
          <p className="text-slate-700 font-medium pl-4">
            <strong className="text-slate-900">{order.customer_name}</strong> ({order.phone})<br />
            {order.shipping_address ? `${order.shipping_address}, ` : ''}{order.city}, {order.state} - {order.pincode}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

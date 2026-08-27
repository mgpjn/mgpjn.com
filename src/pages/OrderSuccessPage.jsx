import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Phone, FileText, Printer } from 'lucide-react';
import GstInvoiceModal from '../components/invoice/GstInvoiceModal';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const order = location.state?.order;
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const orderId = order?.id || id;
  const orderNumber = order?.order_number || id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
          Thank you for choosing MediGlaxo Pharma Junction
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="text-xs text-slate-500 mt-2">
          Your order <strong>#{orderNumber}</strong> has been routed to the local delivery executive.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left max-w-md mx-auto space-y-4 text-xs">
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">Order ID</span>
          <span className="font-bold text-slate-800 font-mono">{orderNumber}</span>
        </div>
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">Payment Mode</span>
          <span className="font-bold text-slate-800 uppercase">{order?.payment_method || 'Online'}</span>
        </div>
        {order?.assigned_sub_retailer && (
          <div className="flex justify-between pb-3 border-b">
            <span className="text-slate-400">Local Delivery Hub</span>
            <span className="font-bold text-emerald-700">{order.assigned_sub_retailer.name} ({order.assigned_sub_retailer.pincode})</span>
          </div>
        )}
        <div className="flex justify-between pb-3 border-b">
          <span className="text-slate-400">Estimated Delivery</span>
          <span className="font-bold text-emerald-600">Local Express (2-24 Hours)</span>
        </div>
        <div className="flex justify-between text-sm font-black text-brand-blue-900">
          <span>Amount Paid</span>
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

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { trackOrder } from '../services/api';

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('number') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await trackOrder(orderNumber.trim());
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError('Order not found. Please verify your order number (e.g. MG20260823001).');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('number')) {
      handleTrack();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Track Your Medicine Order</h1>
        <p className="text-xs text-slate-500">Enter your MediGlaxo Order ID to check live dispatch and delivery status.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleTrack} className="max-w-md mx-auto flex gap-2">
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="e.g. MG20260823001"
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-brand-blue-600 shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md shadow-brand-blue-800/20"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="max-w-md mx-auto p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Order ID</span>
              <h3 className="font-extrabold text-base text-slate-900">#{order.order_number}</h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Status</span>
              <div className="font-extrabold text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase inline-block">
                {order.order_status}
              </div>
            </div>
          </div>

          {/* Courier & Tracking Details Card */}
          {(order.tracking_number || order.courier_name) && (
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
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <span>Track on Courier Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="py-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto font-bold text-xs">✓</div>
                <p className="font-bold text-slate-800 text-[11px]">Placed</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto font-bold text-xs">✓</div>
                <p className="font-bold text-slate-800 text-[11px]">Pharmacist Packed</p>
              </div>
              <div className="space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-xs ${
                  order.order_status === 'dispatched' || order.order_status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <p className="font-bold text-slate-800 text-[11px]">Dispatched</p>
              </div>
              <div className="space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-xs ${
                  order.order_status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  ✓
                </div>
                <p className="font-bold text-slate-800 text-[11px]">Delivered</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3 pt-4 border-t text-xs">
            <h4 className="font-bold text-slate-900">Items Ordered:</h4>
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-slate-600">
                <span>{item.product_name} (×{item.quantity})</span>
                <span className="font-bold">₹{item.total_price.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t flex justify-between font-black text-sm text-slate-900">
              <span>Total Paid:</span>
              <span className="text-brand-blue-900">₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

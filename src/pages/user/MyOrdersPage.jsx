import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, ChevronRight, Clock, MapPin, Truck,
  FileText, Printer, ExternalLink, Copy, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { getUserOrders } from '../../services/api';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';
import OrderTrackingModal from '../../components/orders/OrderTrackingModal';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'upcoming' | 'delivered'
  const [copiedAwb, setCopiedAwb] = useState('');

  useEffect(() => {
    getUserOrders()
      .then((res) => {
        if (res.data.success) {
          setOrders(res.data.orders.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(''), 2000);
  };

  const upcomingOrders = orders.filter(
    (o) => o.order_status === 'dispatched' || o.order_status === 'processing'
  );
  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered');

  const displayedOrders =
    activeTab === 'upcoming'
      ? upcomingOrders
      : activeTab === 'delivered'
      ? deliveredOrders
      : orders;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading orders and upcoming shipments...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Orders &amp; Upcoming Shipments
          </h1>
          <p className="text-xs text-slate-500">
            Track orders dispatched by Head Office / Distributor, view live courier tracking, and download official GST Tax Invoices.
          </p>
        </div>
        <Link
          to="/shop"
          className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-brand-blue-800/20 transition-all text-center inline-block"
        >
          Order Medicines
        </Link>
      </div>

      {/* Inbound Shipment Alert Banner (If there are active dispatched/upcoming orders) */}
      {upcomingOrders.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900">
                  {upcomingOrders.length} Upcoming Inbound Shipment(s) In-Transit To You!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Head Office / Distributor has dispatched stock to your address. Click "Upcoming Orders" or track below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('upcoming')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap transition-all"
          >
            View Upcoming Orders ({upcomingOrders.length})
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'upcoming'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Upcoming Orders ({upcomingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('delivered')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'delivered'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Delivered ({deliveredOrders.length})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-100 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">
            {activeTab === 'upcoming'
              ? 'No Upcoming Inbound Orders At This Time'
              : activeTab === 'delivered'
              ? 'No Delivered Orders Yet'
              : 'No Orders Placed Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'When Head Office or a Distributor dispatches medicine packages to you, they will appear here with live courier tracking.'
              : 'Browse our wide range of authentic medicines, healthcare products, and get them delivered to your doorstep.'}
          </p>
          {activeTab !== 'upcoming' && (
            <Link
              to="/shop"
              className="inline-block bg-brand-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-orange-600 transition-colors"
            >
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isDispatched = order.order_status === 'dispatched';
            const isDelivered = order.order_status === 'delivered';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 transition-all ${
                  isDispatched
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'border-slate-100'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-brand-blue-900">
                        Order #{order.order_number}
                      </span>
                      {order.invoice_number && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                          {order.invoice_number}
                        </span>
                      )}
                      {isDispatched && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          🚚 Dispatched (Upcoming)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Download GST Invoice Button */}
                    <button
                      onClick={() => setSelectedInvoiceOrderId(order.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-orange-500" />
                      <span>GST Invoice (PDF)</span>
                    </button>

                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full uppercase ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-700'
                          : isDispatched
                          ? 'bg-teal-50 text-teal-800'
                          : 'bg-brand-blue-50 text-brand-blue-800'
                      }`}
                    >
                      {order.order_status}
                    </span>

                    {/* Track Order Button */}
                    <button
                      onClick={() => setSelectedTrackingOrder(order)}
                      className="text-xs font-bold text-brand-orange-600 bg-brand-orange-50 hover:bg-brand-orange-100 px-3 py-1.5 rounded-xl border border-brand-orange-200 flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>

                {/* PROMINENT COURIER & TRACKING CARD (For Dispatched / In-Transit Orders) */}
                {(isDispatched || order.tracking_number) && (
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-300/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                          📦 Inbound Shipment Courier
                        </span>
                        <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                          {order.courier_name || 'Express Cargo / Courier'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-medium">AWB / Tracking Number:</span>
                        <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200 select-all">
                          {order.tracking_number || 'Pending'}
                        </span>
                        {order.tracking_number && (
                          <button
                            onClick={() => handleCopy(order.tracking_number)}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            {copiedAwb === order.tracking_number ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {order.dispatched_at && (
                        <span className="text-[10px] text-slate-400 block">
                          Dispatched: {new Date(order.dispatched_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>Track on {order.courier_name || 'Courier'} Site</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedTrackingOrder(order)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Tracking</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-50">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.product?.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80'}
                          alt={item.product_name}
                          className="w-10 h-10 object-cover rounded-lg border"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{item.product_name}</span>
                          <span className="text-slate-400 text-[11px]">
                            Qty: {item.quantity} × ₹{item.unit_price} • HSN: {item.hsn_code || '30049099'}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">₹{Number(item.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Local Delivery Hub & Address */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {order.shipping_address}, {order.city} ({order.pincode})
                      </span>
                    </div>
                    {order.assigned_sub_retailer && (
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-medium text-[11px]">
                        <Truck className="w-3.5 h-3.5" />
                        <span>
                          Assigned Delivery Hub: {order.assigned_sub_retailer.name} ({order.assigned_sub_retailer.phone})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400">Total Paid: </span>
                    <strong className="text-sm font-black text-slate-900">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">
                      Via {order.payment_method} ({order.payment_status})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GST Invoice Modal */}
      {selectedInvoiceOrderId && (
        <GstInvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}

      {/* Order Tracking Modal */}
      {selectedTrackingOrder && (
        <OrderTrackingModal
          order={selectedTrackingOrder}
          isOpen={Boolean(selectedTrackingOrder)}
          onClose={() => setSelectedTrackingOrder(null)}
        />
      )}
    </div>
  );
}

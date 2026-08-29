import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ChevronRight, Clock, MapPin, Truck, FileText, Printer } from 'lucide-react';
import { getUserOrders } from '../../services/api';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';
import OrderTrackingModal from '../../components/orders/OrderTrackingModal';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Medicine Orders</h1>
          <p className="text-xs text-slate-500">Track orders and download official GST Tax Invoices (PDF Bill).</p>
        </div>
        <Link to="/shop" className="bg-brand-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold">
          Order Medicines
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-100 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse our wide range of authentic medicines, healthcare products, and get them delivered to your doorstep.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-brand-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4"
            >
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
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {order.order_status === 'dispatched' && order.tracking_number && (
                    <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                      🚚 Dispatched via <strong className="text-emerald-900">{order.courier_name || 'Express Courier'}</strong> • AWB: <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{order.tracking_number}</span>
                    </span>
                  )}
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

                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase ${
                    order.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-blue-50 text-brand-blue-800'
                  }`}>
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
                    <span className="font-bold text-slate-900">₹{item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Local Delivery Hub & Total Address */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.shipping_address}, {order.city} ({order.pincode})</span>
                  </div>
                  {order.assigned_sub_retailer && (
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-medium text-[11px]">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Assigned Delivery Hub: {order.assigned_sub_retailer.name} ({order.assigned_sub_retailer.phone})</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-slate-400">Total Paid: </span>
                  <strong className="text-sm font-black text-slate-900">₹{order.total_amount.toFixed(2)}</strong>
                  <span className="text-[10px] text-slate-400 block uppercase">Via {order.payment_method}</span>
                </div>
              </div>
            </div>
          ))}
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

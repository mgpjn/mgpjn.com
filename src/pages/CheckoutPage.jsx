import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, CreditCard, QrCode, Banknote, ArrowRight,
  Truck, CheckCircle2, Lock, Sparkles, Store, Wallet
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, getWalletTransactions } from '../services/api';

export default function CheckoutPage() {
  const { cartItems, subtotal, deliveryCharge, finalTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    shipping_address: user?.address || '',
    city: user?.city || '',
    state: user?.state || 'Delhi',
    pincode: user?.pincode || '',
    payment_method: 'cod',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(user?.wallet_balance || 0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (user) {
      getWalletTransactions()
        .then((res) => {
          if (res.data?.success && res.data?.balance !== undefined) {
            const bal = parseFloat(res.data.balance) || 0;
            setWalletBalance(bal);
            if (bal > 0) {
              setUseWallet(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const isTakeaway = formData.payment_method === 'takeaway';
  const effectiveDeliveryCharge = isTakeaway ? 0 : deliveryCharge;
  const payableTotal = subtotal + effectiveDeliveryCharge;

  const walletAmountUsed = useWallet ? Math.min(payableTotal, walletBalance) : 0;
  const remainingPayable = Math.max(0, payableTotal - walletAmountUsed);
  const isFullWallet = useWallet && walletAmountUsed >= payableTotal;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Store className="w-8 h-8 text-brand-blue-800" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your cart is currently empty</h2>
        <p className="text-xs text-slate-500">Please add medicines to your cart before proceeding to checkout.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-6 py-2.5 bg-brand-blue-800 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-blue-900 transition-all cursor-pointer"
        >
          Explore Medicines Catalog
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email,
        shipping_address: isTakeaway ? (formData.shipping_address || 'Store Takeaway / Self Pickup Counter') : formData.shipping_address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        payment_method: isFullWallet ? 'wallet' : (walletAmountUsed > 0 ? 'wallet_split' : formData.payment_method),
        other_payment_method: (walletAmountUsed > 0 && !isFullWallet) ? formData.payment_method : null,
        wallet_amount_used: walletAmountUsed,
        delivery_type: isTakeaway ? 'takeaway' : 'home_delivery',
        notes: isTakeaway
          ? `[STORE TAKEAWAY / SELF PICKUP] ${formData.notes || ''}`.trim()
          : formData.notes,
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const res = await createOrder(orderPayload);
      if (res.data.success) {
        const placedOrder = res.data.order;
        clearCart();
        navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 tracking-tight">
        Secure Checkout
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Shipping & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Delivery Address */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-brand-blue-800" />
              <span>1. Delivery &amp; Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (For Delivery SMS) *</label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Street Address *</label>
              <textarea
                required
                rows="2"
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                placeholder="House / Flat No., Landmark, Street Address..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                <input
                  type="text"
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                <input
                  type="text"
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 110001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-brand-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-brand-blue-800" />
              <span>2. Select Payment &amp; Delivery Mode</span>
            </h3>

            {/* Wallet Balance & Combined Payment Card */}
            {user && (
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                useWallet && walletAmountUsed > 0
                  ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-emerald-300 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      useWallet && walletAmountUsed > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          MediGlaxo Wallet Balance
                        </h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ₹{walletBalance.toFixed(2)} Available
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {walletBalance > 0
                          ? 'Use your earned wallet commissions towards this purchase.'
                          : 'Your wallet balance is ₹0.00. Earn commissions on downline orders to pay via wallet.'}
                      </p>
                    </div>
                  </div>

                  {walletBalance > 0 && (
                    <label className="flex items-center space-x-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-500 transition-all select-none self-start sm:self-auto">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {useWallet ? 'Using Wallet Balance' : 'Pay with Wallet'}
                      </span>
                    </label>
                  )}
                </div>

                {/* Live Split/Full Calculation Banner */}
                {useWallet && walletAmountUsed > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/70">
                    {isFullWallet ? (
                      <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs flex items-center space-x-2 text-emerald-950 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>
                          <strong>100% Wallet Paid:</strong> Full ₹{payableTotal.toFixed(2)} will be debited directly from your MediGlaxo Wallet. No cash or card payment needed!
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start space-x-2.5 text-amber-950">
                        <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <strong className="block text-amber-900 font-bold">
                            ⚡ Combined Split Payment Applied:
                          </strong>
                          <span>
                            <strong>₹{walletAmountUsed.toFixed(2)}</strong> will be deducted from your Wallet balance.
                            Please select any payment mode below to pay the remaining <strong>₹{remainingPayable.toFixed(2)}</strong>:
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isTakeaway && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center space-x-2.5 text-emerald-900 shadow-2xs">
                <Store className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <strong className="block text-emerald-950">🏬 Store Takeaway (Self Pickup) Selected:</strong>
                  <span className="text-emerald-800 text-[11px]">
                    Enjoy <strong>₹0 Delivery Fee</strong>! Your medicines will be kept packed and ready for counter pickup within 30-60 minutes at your nearest MediGlaxo authorized pharmacy hub.
                  </span>
                </div>
              </div>
            )}

            {/* If 100% wallet paid, inform user that secondary payment is not needed */}
            {isFullWallet ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
                ✨ Your wallet balance is paying the full amount of ₹{payableTotal.toFixed(2)}. Secondary payment options are bypassed.
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2.5">
                  {walletAmountUsed > 0
                    ? `Select Payment Mode for Remaining Balance (₹${remainingPayable.toFixed(2)})`
                    : 'Select Payment Mode'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.payment_method === 'cod'
                        ? 'border-brand-blue-800 bg-brand-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Banknote className="w-6 h-6 text-brand-blue-800" />
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={formData.payment_method === 'cod'}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Cash on Delivery</h4>
                      <p className="text-[10px] text-slate-500">
                        {walletAmountUsed > 0 ? `Pay remaining ₹${remainingPayable.toFixed(2)} cash.` : 'Pay cash upon home delivery.'}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.payment_method === 'upi_qr'
                        ? 'border-brand-blue-800 bg-brand-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <QrCode className="w-6 h-6 text-emerald-600" />
                      <input
                        type="radio"
                        name="payment_method"
                        value="upi_qr"
                        checked={formData.payment_method === 'upi_qr'}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Instant UPI QR</h4>
                      <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm QR.</p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.payment_method === 'online'
                        ? 'border-brand-blue-800 bg-brand-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className="w-6 h-6 text-brand-orange-500" />
                      <input
                        type="radio"
                        name="payment_method"
                        value="online"
                        checked={formData.payment_method === 'online'}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Net Banking / Card</h4>
                      <p className="text-[10px] text-slate-500">Credit / Debit card & NetBanking.</p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      formData.payment_method === 'takeaway'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Store className="w-6 h-6 text-emerald-700" />
                      <input
                        type="radio"
                        name="payment_method"
                        value="takeaway"
                        checked={formData.payment_method === 'takeaway'}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <h4 className="font-bold text-xs text-slate-800">Store Takeaway</h4>
                        <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">FREE</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {walletAmountUsed > 0 ? `Pay remaining ₹${remainingPayable.toFixed(2)} at counter.` : 'Self pickup & pay at local pharmacy counter.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Order Review */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base">Review Items ({cartItems.length})</h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block truncate max-w-[180px]">{item.name}</span>
                  <span className="text-slate-400">Qty: {item.quantity} × ₹{item.price}</span>
                </div>
                <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>
                {isTakeaway ? (
                  <strong className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                    FREE (Takeaway)
                  </strong>
                ) : effectiveDeliveryCharge === 0 ? (
                  <strong className="text-emerald-600">FREE</strong>
                ) : (
                  `₹${effectiveDeliveryCharge}`
                )}
              </span>
            </div>

            {walletAmountUsed > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="flex items-center space-x-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Wallet Balance Used</span>
                </span>
                <span>- ₹{walletAmountUsed.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t">
              <span>Total Payable Now</span>
              <span className="text-brand-blue-800">₹{remainingPayable.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>
                  {isFullWallet
                    ? `Pay ₹${payableTotal.toFixed(2)} with Wallet Balance (100% Full Payment)`
                    : walletAmountUsed > 0
                    ? `Pay ₹${remainingPayable.toFixed(2)} via ${formData.payment_method.toUpperCase()} + ₹${walletAmountUsed.toFixed(2)} from Wallet`
                    : isTakeaway
                    ? `Confirm Store Takeaway (Self Pickup) • ₹${payableTotal.toFixed(2)}`
                    : formData.payment_method === 'cod'
                    ? `Confirm Cash on Delivery (COD) Order • ₹${payableTotal.toFixed(2)}`
                    : `Place Order & Pay ₹${payableTotal.toFixed(2)}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

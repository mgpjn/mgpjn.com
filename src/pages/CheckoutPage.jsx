import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, CreditCard, QrCode, Banknote, ArrowRight,
  Truck, CheckCircle2, Lock, Sparkles, Store, Wallet, AlertCircle,
  UserCheck, MapPin, Plus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  createOrder, getWalletTransactions, createRazorpayOrder, verifyRazorpayPayment,
  quoteOrder, getActiveCoupons
} from '../services/api';
import { buildQuotePayload, quoteErrorMessage, verifyQuote } from '../services/checkoutPricing';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getAddressStorageKey = (user) => `mediglaxo_checkout_addresses_${user?.id || user?.phone || 'guest'}`;

const normalizeAddress = (address) => ({
  customer_name: address?.customer_name || address?.name || '',
  phone: address?.phone || '',
  email: address?.email || '',
  shipping_address: address?.shipping_address || address?.address || '',
  city: address?.city || '',
  state: address?.state || 'Delhi',
  pincode: address?.pincode || '',
});

const hasUsableAddress = (address) => Boolean(
  address?.shipping_address && address?.city && address?.state && address?.pincode
);

const readSavedAddresses = (user) => {
  try {
    const stored = JSON.parse(localStorage.getItem(getAddressStorageKey(user)) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export default function CheckoutPage() {
  const { cartItems, subtotal: cartSubtotal, deliveryCharge, clearCart } = useCart();
  const { user, token } = useAuth();
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
  const [walletBalance, setWalletBalance] = useState(user?.wallet_balance ? Number(user.wallet_balance) : 0);
  const [useWallet, setUseWallet] = useState(false);
  const [addressMode, setAddressMode] = useState('new');
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [offers, setOffers] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);
  const pricingPayload = buildQuotePayload({ items: cartItems, state: formData.state, pincode: formData.pincode,
    paymentMethod: formData.payment_method, useWallet, walletBalance, couponCode });
  const quoteKey = JSON.stringify({ token, ...pricingPayload });
  const quoteReady = Boolean(user && quote?.key === quoteKey);
  const summary = quoteReady ? quote.data.payment_summary : null;
  useEffect(() => {
    if (!user || !cartItems.length) { setQuote(null); return; }
    const controller = new AbortController();
    let active = true;
    setQuoteError('');
    const timer = setTimeout(async () => {
      try {
        const res = await quoteOrder(pricingPayload, { signal: controller.signal });
        const data = verifyQuote(res.data);
        if (active) setQuote({ key: quoteKey, data });
      } catch (err) { if (active) { setQuote(null); setQuoteError(quoteErrorMessage(err)); } }
    }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [quoteKey, quoteRetry]);
  useEffect(() => {
    let active = true;
    getActiveCoupons({ subtotal: summary?.subtotal ?? cartSubtotal, delivery_charge: formData.payment_method === 'takeaway' ? 0 : deliveryCharge })
      .then((res) => { if (active) setOffers(res.data?.coupons || []); }).catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, [summary?.subtotal, cartSubtotal, deliveryCharge, formData.payment_method]);
  const applyCoupon = async (code = couponInput) => {
    const cleaned = code.trim().toUpperCase();
    if (!user) { setCouponError('Sign in to apply a coupon to your order.'); return; }
    if (!cleaned) { setCouponError('Enter a coupon code.'); return; }
    setCouponBusy(true); setCouponError('');
    try {
      verifyQuote((await quoteOrder({ ...pricingPayload, coupon_code: cleaned })).data);
      setCouponCode(cleaned); setCouponInput(cleaned); setQuoteRetry((value) => value + 1);
    } catch (err) { setCouponError(quoteErrorMessage(err)); }
    finally { setCouponBusy(false); }
  };

  useEffect(() => {
    if (user) {
      const profileAddress = normalizeAddress({
        customer_name: user.name,
        phone: user.phone,
        email: user.email,
        shipping_address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
      });
      const stored = readSavedAddresses(user);
      const addresses = [
        ...(hasUsableAddress(profileAddress) ? [{ ...profileAddress, label: 'Profile address' }] : []),
        ...stored,
      ].filter(hasUsableAddress);

      setSavedAddresses(addresses);
      setAddressMode(addresses.length > 0 ? 'saved' : 'new');

      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        shipping_address: prev.shipping_address || user.address || '',
        city: prev.city || user.city || '',
        state: prev.state || user.state || 'Delhi',
        pincode: prev.pincode || user.pincode || '',
      }));

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

  const applyAddress = (address, mode = 'saved') => {
    const normalized = normalizeAddress(address);
    setAddressMode(mode);
    setFormData((prev) => ({
      ...prev,
      ...normalized,
      email: normalized.email || prev.email || user?.email || '',
    }));
  };

  const startNewAddress = () => {
    setAddressMode('new');
    setFormData((prev) => ({
      ...prev,
      customer_name: user?.name || prev.customer_name || '',
      phone: user?.phone || prev.phone || '',
      email: user?.email || prev.email || '',
      shipping_address: '',
      city: '',
      state: user?.state || 'Delhi',
      pincode: '',
    }));
  };

  const startRecipientAddress = () => {
    setAddressMode('recipient');
    setFormData((prev) => ({
      ...prev,
      customer_name: '',
      phone: '',
      shipping_address: '',
      city: '',
      state: user?.state || 'Delhi',
      pincode: '',
    }));
  };

  const rememberCheckoutAddress = () => {
    if (!user || !hasUsableAddress(formData)) return;
    const key = getAddressStorageKey(user);
    const current = {
      ...normalizeAddress(formData),
      label: addressMode === 'recipient' ? 'Recipient address' : 'Previous address',
      saved_at: new Date().toISOString(),
    };
    const existing = readSavedAddresses(user);
    const filtered = existing.filter((addr) => (
      `${addr.shipping_address}|${addr.city}|${addr.pincode}`.toLowerCase()
      !== `${current.shipping_address}|${current.city}|${current.pincode}`.toLowerCase()
    ));
    localStorage.setItem(key, JSON.stringify([current, ...filtered].slice(0, 5)));
    setSavedAddresses([current, ...filtered].slice(0, 5));
  };

  const isTakeaway = formData.payment_method === 'takeaway';
  const subtotal = summary?.subtotal ?? cartSubtotal;
  const effectiveDeliveryCharge = summary?.delivery_charge ?? (isTakeaway ? 0 : deliveryCharge);
  const payableTotal = summary?.total_amount ?? subtotal + effectiveDeliveryCharge;
  const walletAmountUsed = summary?.wallet_used ?? 0;
  const remainingPayable = summary?.payable_now ?? payableTotal;
  const isFullWallet = Boolean(summary && payableTotal > 0 && walletAmountUsed >= payableTotal);

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

    if (!user) {
      toast.error('Please sign in or create an account to place your order.');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (loading) return;
    if (!quoteReady || couponBusy) { setError('Please wait for your order amount to be verified.'); return; }
    setLoading(true);
    setError('');

    try {
      const verified = verifyQuote((await quoteOrder(pricingPayload)).data);
      const freshSummary = verified.payment_summary;
      if (JSON.stringify(freshSummary) !== JSON.stringify(summary)) {
        setQuote({ key: quoteKey, data: verified });
        throw new Error('Your order amount has changed. Review the updated total, then place your order again.');
      }
      const orderPayload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email,
        shipping_address: isTakeaway ? (formData.shipping_address || 'Store Takeaway / Self Pickup Counter') : formData.shipping_address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        payment_method: pricingPayload.payment_method,
        other_payment_method: pricingPayload.other_payment_method,
        coupon_code: couponCode || null,
        wallet_amount_used: freshSummary.wallet_used,
        delivery_type: isTakeaway ? 'takeaway' : 'home_delivery',
        notes: isTakeaway
          ? `[STORE TAKEAWAY / SELF PICKUP] ${formData.notes || ''}`.trim()
          : formData.notes,
        sponsor_code:
          localStorage.getItem('mediglaxo_sponsor_code') ||
          sessionStorage.getItem('mediglaxo_sponsor_code') ||
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('mediglaxo_ref='))
            ?.split('=')[1],
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const isOnlinePayment = !isFullWallet && (formData.payment_method === 'online' || formData.payment_method === 'upi_qr');

      if (isOnlinePayment && freshSummary.payable_now > 0) {
        if (!await loadRazorpayScript()) throw new Error('Payment gateway could not load. Please try again.');
        // 1. Create order in DB (marked pending)
        const orderRes = await createOrder(orderPayload);
        if (!orderRes.data?.success) {
          throw new Error(orderRes.data?.message || 'Could not create order.');
        }
        const placedOrder = orderRes.data.order;
        rememberCheckoutAddress();

        const chargedSummary = verifyQuote(orderRes.data).payment_summary;

        // 3. Create Razorpay Order
        const rzpOrderRes = await createRazorpayOrder({
          amount: chargedSummary.payable_now,
          order_number: placedOrder.order_number,
          customer_name: formData.customer_name,
          customer_email: formData.email,
          customer_phone: formData.phone,
        });

        if (!rzpOrderRes.data?.success) {
          throw new Error(rzpOrderRes.data?.message || 'Failed to initialize payment gateway.');
        }

        const rzpData = rzpOrderRes.data;

        // 4. Open Razorpay Checkout modal
        const options = {
          key: rzpData.key_id,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'MEDIGLAXO PHARMA JUNCTION',
          description: `Order #${placedOrder.order_number} Payment`,
          image: '/logo.png',
          order_id: rzpData.razorpay_order_id,
          prefill: {
            name: formData.customer_name,
            email: formData.email || '',
            contact: formData.phone,
          },
          theme: {
            color: '#1e3a8a',
          },
          handler: async function (response) {
            try {
              setLoading(true);
              const paymentRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_number: placedOrder.order_number,
                order_id: placedOrder.id,
              });
              if (!paymentRes.data?.success) throw new Error(paymentRes.data?.message || 'Payment verification is pending.');
              clearCart();
              rememberCheckoutAddress();
              navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
            } catch (vErr) {
              setError(`Payment could not be verified for order ${placedOrder.order_number}. Check My Orders before trying again. ${quoteErrorMessage(vErr)}`);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
        return;
      }

      // Standard COD, Takeaway, or 100% Wallet Order
      const res = await createOrder(orderPayload);
      if (!res.data?.success) throw new Error(res.data?.message || 'Order could not be placed.');
      if (res.data.success) {
        const placedOrder = res.data.order;
        rememberCheckoutAddress();
        clearCart();
        navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
      }
    } catch (err) {
      setError(quoteErrorMessage(err));
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
        <fieldset disabled={loading || couponBusy} className="lg:col-span-8 space-y-6 min-w-0">
          {!user ? (
            <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-3xl p-6 space-y-3">
              <h3 className="font-extrabold text-brand-blue-800">Sign in to complete your order</h3>
              <p className="text-xs text-slate-600">Use your login PIN or fingerprint. Mobile/email OTP and password are also available.</p>
              <Link to="/login?redirect=/checkout" className="inline-block bg-brand-blue-800 text-white px-5 py-3 rounded-xl text-xs font-bold">Login with PIN / OTP</Link>
              <Link to="/register?redirect=/checkout" className="block text-xs font-bold text-brand-orange-500">Create Customer Account</Link>
            </div>
          ) : (
            /* Logged in Account Banner */
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 md:p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Verified Account: {user.name}
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      ✓ Logged In
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Phone: <strong className="font-mono">+91 {user.phone}</strong> {user.email && `• ${user.email}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 1. Delivery Address */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-brand-blue-800" />
              <span>1. Delivery &amp; Contact Details</span>
            </h3>

            {user && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => savedAddresses[0] ? applyAddress(savedAddresses[0], 'saved') : startNewAddress()}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      addressMode === 'saved'
                        ? 'border-brand-blue-800 bg-brand-blue-50/60'
                        : 'border-slate-200 bg-slate-50 hover:border-brand-blue-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-brand-blue-800 mb-1.5" />
                    <div className="text-xs font-black text-slate-900">Use previous address</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {savedAddresses.length > 0 ? 'Saved/profile address available' : 'No saved address yet'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={startNewAddress}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      addressMode === 'new'
                        ? 'border-emerald-600 bg-emerald-50/70'
                        : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-emerald-700 mb-1.5" />
                    <div className="text-xs font-black text-slate-900">Add new address</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Fresh delivery location</div>
                  </button>

                  <button
                    type="button"
                    onClick={startRecipientAddress}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      addressMode === 'recipient'
                        ? 'border-brand-orange-500 bg-orange-50/80'
                        : 'border-slate-200 bg-slate-50 hover:border-brand-orange-300'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-brand-orange-500 mb-1.5" />
                    <div className="text-xs font-black text-slate-900">Order for someone else</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Recipient name and phone</div>
                  </button>
                </div>

                {savedAddresses.length > 0 && addressMode === 'saved' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedAddresses.slice(0, 4).map((address, index) => (
                      <button
                        key={`${address.shipping_address}-${address.pincode}-${index}`}
                        type="button"
                        onClick={() => applyAddress(address, 'saved')}
                        className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-blue-500 hover:bg-brand-blue-50/30 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-black text-slate-900">
                              {address.label || 'Previous address'}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {address.customer_name || user.name} • {address.phone || user.phone}
                              <br />
                              {address.shipping_address}, {address.city}, {address.state} - {address.pincode}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-brand-blue-800 bg-brand-blue-50 px-2 py-0.5 rounded-full">
                            Use
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {addressMode === 'recipient' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-900 font-semibold">
                Recipient details bhar do. Order account aapke login se place hoga, delivery kisi aur ke name/number/address par ja sakti hai.
              </div>
            )}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number (For Delivery SMS) *</label>

                </div>
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
        </fieldset>

        {/* Right Order Review */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base">Review Items ({cartItems.length})</h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
            {cartItems.map((cartItem) => {
              const serverItem = quoteReady ? quote.data.items?.find((entry) => entry.product_id === cartItem.id) : null;
              const item = { ...cartItem, price: serverItem?.unit_price ?? cartItem.price };
              return (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block truncate max-w-[180px]">{item.name}</span>
                  <span className="text-slate-400">Qty: {item.quantity} {item.isWholesale ? (item.box_unit || 'Unit') : (item.strip_unit || item.unit || 'Unit')} × ₹{item.price}</span>
                </div>
                <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ); })}
          </div>

          <section className="border border-slate-200 rounded-2xl p-4 space-y-3" aria-label="Apply coupon code">
            <label htmlFor="coupon-code" className="block text-xs font-extrabold text-slate-800">Apply Coupon Code</label>
            <div className="flex gap-2">
              <input id="coupon-code" autoComplete="off" maxLength={60} value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!couponBusy && !loading) applyCoupon(); } }} placeholder="Enter coupon code" disabled={loading || couponBusy} className="min-w-0 flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs uppercase" />
              <button type="button" onClick={() => applyCoupon()} disabled={couponBusy || loading} className="bg-brand-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">{couponBusy ? 'Checking...' : 'Apply'}</button>
            </div>
            {couponCode && <div className="flex justify-between items-center gap-2 text-xs text-emerald-700"><span>{couponCode} {quoteReady ? 'applied' : '— verifying'}</span><button type="button" disabled={loading || couponBusy} onClick={() => { setCouponCode(''); setCouponInput(''); setCouponError(''); }} className="font-bold text-rose-600">Remove</button></div>}
            {couponError && <p role="alert" className="text-xs text-rose-600">{couponError}</p>}
            {offers.length > 0 && <details><summary className="text-xs font-bold text-brand-blue-800 cursor-pointer">Available offers</summary><div className="mt-2 space-y-2">{offers.slice(0, 5).map((offer) => <button key={offer.code} type="button" disabled={couponBusy || loading} onClick={() => applyCoupon(offer.code)} className="block text-left w-full border border-dashed border-slate-200 p-2 rounded-lg text-xs"><strong>{offer.code}</strong><span className="block text-slate-500">{offer.title}</span></button>)}</div></details>}
            {!user && <Link to="/login?redirect=/checkout" className="block text-xs font-bold text-brand-blue-800">Sign in to apply your coupon</Link>}
          </section>
          {user && <div role={quoteError ? 'alert' : 'status'} className={`text-xs ${quoteError ? 'text-rose-600' : 'text-slate-500'}`}>
            {quoteError || (quoteReady ? 'Order amount verified' : 'Verifying your order amount...')}
            {quoteError && <button type="button" onClick={() => setQuoteRetry((value) => value + 1)} className="block font-bold mt-1">Retry verification</button>}
          </div>}
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

            {summary?.platform_fee > 0 && <div className="flex justify-between text-slate-600"><span>Platform Fee</span><span>₹{summary.platform_fee.toFixed(2)}</span></div>}
            {summary?.cod_charge > 0 && <div className="flex justify-between text-slate-600"><span>COD Fee</span><span>₹{summary.cod_charge.toFixed(2)}</span></div>}
            {summary?.coupon_discount > 0 && <div className="flex justify-between text-emerald-700 font-bold"><span>Coupon Discount</span><span>- ₹{summary.coupon_discount.toFixed(2)}</span></div>}
            {summary?.delivery_discount > 0 && <p className="text-emerald-700 text-[11px]">Delivery savings: ₹{summary.delivery_discount.toFixed(2)} (included above)</p>}
            <div className="flex justify-between font-bold text-slate-700"><span>Order Total</span><span>₹{payableTotal.toFixed(2)}</span></div>
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

          {!user ? (
            <Link to="/login?redirect=/checkout" className="block text-center w-full bg-brand-orange-500 text-white py-4 rounded-2xl font-bold text-xs">Sign In &amp; Continue Checkout</Link>
          ) : (
            <button
              type="submit"
              disabled={loading || !quoteReady || couponBusy}
              className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading || !quoteReady ? (
                <span>{loading ? 'Placing Order...' : 'Verifying Total...'}</span>
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
          )}
        </div>
      </form>
    </div>
  );
}

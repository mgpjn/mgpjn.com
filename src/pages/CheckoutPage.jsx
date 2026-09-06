import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, CreditCard, QrCode, Banknote, ArrowRight,
  Truck, CheckCircle2, Lock, Sparkles, Store, Wallet, AlertCircle,
  Smartphone, RefreshCw, X, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  createOrder, getWalletTransactions, createRazorpayOrder, verifyRazorpayPayment,
  sendPhoneOtp, verifyPhoneOtp, loginWithPhone, registerUser
} from '../services/api';
import { sendFirebasePhoneOtp, clearRecaptchaVerifier } from '../config/firebase';

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

export default function CheckoutPage() {
  const { cartItems, subtotal, deliveryCharge, finalTotal, clearCart } = useCart();
  const { user, setDirectSession, register } = useAuth();
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

  // Mobile Phone OTP Checkout & Login State
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [phoneOtpStatus, setPhoneOtpStatus] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Quick Register Modal/Inline State
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickPassword, setQuickPassword] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(false);

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneTimer]);

  useEffect(() => {
    if (user) {
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

  const handleSendCheckoutOtp = async (targetPhone) => {
    const cleanPhone = (targetPhone || formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      setPhoneOtpError(msg);
      toast.error(msg);
      return;
    }

    setPhoneOtpSending(true);
    setPhoneOtpError('');
    setPhoneOtpStatus('');
    setIsAccountNotFound(false);

    try {
      // 1. Verify phone is registered in DB and send OTP via Fast2SMS/Backend
      const res = await sendPhoneOtp({ phone: cleanPhone, type: 'login' });
      if (!res.data?.success) {
        const msg = res.data?.message || 'This mobile number is not registered with us.';
        setPhoneOtpError(msg);
        setIsAccountNotFound(true);
        setPhoneOtpSending(false);
        return;
      }

      // 2. Also attempt Firebase SMS with 12s timeout
      try {
        const firebasePromise = sendFirebasePhoneOtp(cleanPhone, 'checkout-recaptcha-container');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase service timed out')), 12000)
        );
        const result = await Promise.race([firebasePromise, timeoutPromise]);
        setPhoneConfirmation(result);
      } catch (fbErr) {
        console.warn('Firebase SMS fallback to backend SMS:', fbErr.message);
      }

      setPhoneOtpSent(true);
      setPhoneTimer(60);
      setPhoneOtpStatus(`SMS OTP sent to +91 ${cleanPhone}`);
      toast.success(`SMS OTP sent to +91 ${cleanPhone}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'This mobile number is not registered with us. Please create an account or sign in.';
      setPhoneOtpError(msg);
      if (err.response?.status === 404 || (msg && msg.toLowerCase().includes('not registered'))) {
        setIsAccountNotFound(true);
      }
      toast.error(msg);
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const handleVerifyCheckoutOtp = async (cleanOtpOverride) => {
    const cleanOtp = (cleanOtpOverride || phoneOtpInput).trim();
    if (cleanOtp.length !== 6) {
      setPhoneOtpError('Please enter the 6-digit SMS OTP.');
      return;
    }
    setPhoneOtpVerifying(true);
    setPhoneOtpError('');

    let isOtpValid = false;

    // 1. Try Firebase confirmation if available
    if (phoneConfirmation) {
      try {
        await phoneConfirmation.confirm(cleanOtp);
        isOtpValid = true;
      } catch (fbErr) {
        console.warn('Firebase confirm failed, checking backend OTP:', fbErr.message);
      }
    }

    // 2. Backend OTP Verification
    if (!isOtpValid) {
      try {
        const backendRes = await verifyPhoneOtp({ phone: formData.phone, otp: cleanOtp });
        if (backendRes.data?.success) {
          isOtpValid = true;
        }
      } catch (backendErr) {
        console.warn('Backend OTP verification failed:', backendErr.response?.data?.message || backendErr.message);
      }
    }

    if (!isOtpValid) {
      setPhoneOtpVerifying(false);
      setPhoneOtpError('Invalid or expired SMS OTP. Please check your SMS or click Resend.');
      return;
    }

    // 3. Complete Phone Login Session
    try {
      const res = await loginWithPhone({
        phone: formData.phone,
        otp: cleanOtp,
        firebase_verified: Boolean(phoneConfirmation),
      });

      if (res.data?.success && res.data?.token && res.data?.user) {
        clearRecaptchaVerifier();
        setDirectSession(res.data.token, res.data.user);
        setPhoneOtpSent(false);
        setPhoneOtpInput('');
        setPhoneOtpError('');
        setPhoneOtpStatus('');
        toast.success(`🎉 Welcome back, ${res.data.user.name || 'Customer'}! Account verified.`);
      }
    } catch (err) {
      console.error('Phone login error:', err);
      setPhoneOtpError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
      toast.error('Failed to complete login session.');
    } finally {
      setPhoneOtpVerifying(false);
    }
  };

  const handleQuickRegister = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.customer_name?.trim()) {
      toast.error('Please enter your full name in the form.');
      return;
    }
    if (!quickPassword || quickPassword.length < 6) {
      toast.error('Please create a password of at least 6 characters.');
      return;
    }

    setPhoneOtpSending(true);
    try {
      const res = await register({
        name: formData.customer_name,
        phone: cleanPhone,
        email: formData.email || undefined,
        password: quickPassword,
        role: 'customer',
      });
      setShowQuickRegister(false);
      setIsAccountNotFound(false);
      setPhoneOtpSent(false);
      toast.success(`🎉 Account created! Welcome to MediGlaxo, ${formData.customer_name}.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      toast.error(msg);
      setPhoneOtpError(msg);
    } finally {
      setPhoneOtpSending(false);
    }
  };

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

    if (!user) {
      toast.error('Please sign in or create an account to place your order.');
      navigate('/login?redirect=/checkout');
      return;
    }

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

      const isOnlinePayment = !isFullWallet && (formData.payment_method === 'online' || formData.payment_method === 'upi_qr');

      if (isOnlinePayment && remainingPayable > 0) {
        // 1. Create order in DB (marked pending)
        const orderRes = await createOrder(orderPayload);
        if (!orderRes.data?.success) {
          throw new Error(orderRes.data?.message || 'Could not create order.');
        }
        const placedOrder = orderRes.data.order;

        // 2. Load Razorpay Checkout SDK
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          clearCart();
          navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
          return;
        }

        // 3. Create Razorpay Order
        const rzpOrderRes = await createRazorpayOrder({
          amount: remainingPayable,
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
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_number: placedOrder.order_number,
                order_id: placedOrder.id,
              });
              clearCart();
              navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
            } catch (vErr) {
              clearCart();
              navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
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
      if (res.data.success) {
        const placedOrder = res.data.order;
        clearCart();
        navigate(`/order-success/${placedOrder.order_number}`, { state: { order: placedOrder } });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process order. Please try again.');
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

      {/* Invisible reCAPTCHA container for Checkout OTP */}
      <div id="checkout-recaptcha-container"></div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Shipping & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          {!user ? (
            /* ======================================================== */
            /* ⚡ QUICK CHECKOUT WITH MOBILE OTP CARD (FOR EXISTING ACCOUNTS) */
            /* ======================================================== */
            <div className="bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-300 rounded-3xl p-6 md:p-7 shadow-md space-y-5 animate-in fade-in">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 bg-brand-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-brand-orange-500/20">
                  <Smartphone className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm md:text-base font-black text-slate-900">
                      ⚡ Quick Checkout with Mobile OTP
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-brand-orange-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      Fast Login
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Already have an account? Enter your registered mobile number below to sign in instantly with a 6-digit SMS OTP — no password needed!
                  </p>
                </div>
              </div>

              {phoneOtpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{phoneOtpError}</span>
                </div>
              )}

              {phoneOtpStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{phoneOtpStatus}</span>
                </div>
              )}

              {!phoneOtpSent ? (
                /* Step 1: Mobile Phone Input & Send OTP Button */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex flex-1">
                      <span className="inline-flex items-center px-3.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-bold text-slate-700">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter 10-Digit Registered Number"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-r-xl text-xs font-bold focus:outline-none focus:border-brand-orange-500 shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendCheckoutOtp()}
                      disabled={phoneOtpSending || (formData.phone || '').replace(/\D/g, '').length < 10}
                      className="px-6 py-2.5 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-orange-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      {phoneOtpSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                      <span>{phoneOtpSending ? 'Sending OTP...' : 'Send SMS OTP'}</span>
                    </button>
                  </div>

                  {isAccountNotFound && (
                    <div className="p-3.5 bg-amber-100/70 border border-amber-300 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
                        <span>New to MediGlaxo? Create account in 10 seconds:</span>
                        <button
                          type="button"
                          onClick={() => setShowQuickRegister(!showQuickRegister)}
                          className="text-brand-orange-600 underline text-xs font-bold cursor-pointer"
                        >
                          {showQuickRegister ? 'Hide' : 'Quick Register Now'}
                        </button>
                      </div>

                      {showQuickRegister && (
                        <div className="space-y-2.5 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            placeholder="Your Full Name (e.g. Amit Patel)"
                            className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:border-brand-orange-500"
                          />
                          <div className="relative">
                            <input
                              type={showQuickPassword ? 'text' : 'password'}
                              value={quickPassword}
                              onChange={(e) => setQuickPassword(e.target.value)}
                              placeholder="Create Password (min 6 chars)"
                              className="w-full pl-3.5 pr-10 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:border-brand-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowQuickPassword(!showQuickPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                            >
                              {showQuickPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleQuickRegister}
                            disabled={phoneOtpSending}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            {phoneOtpSending ? 'Creating Account...' : 'Create Account & Continue'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Prefer standard login?</span>
                    <div className="flex items-center space-x-3">
                      <Link to="/login?redirect=/checkout" className="text-brand-blue-800 font-bold hover:underline">
                        Password Sign In
                      </Link>
                      <span className="text-slate-300">•</span>
                      <Link to="/register?redirect=/checkout" className="text-brand-orange-600 font-bold hover:underline">
                        Register Account
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: 6-Digit OTP Verification Box */
                <div className="p-4 bg-white/90 border-2 border-brand-orange-300 rounded-2xl space-y-3 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-orange-500" />
                      <span>Enter 6-Digit SMS OTP:</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      {phoneTimer > 0 ? (
                        <span className="text-[10px] text-slate-400 font-semibold">Resend in {phoneTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendCheckoutOtp()}
                          disabled={phoneOtpSending}
                          className="text-[11px] text-brand-orange-600 hover:text-brand-orange-700 font-bold underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          setPhoneOtpInput('');
                          setPhoneOtpError('');
                          setPhoneOtpStatus('');
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Change Number</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={phoneOtpInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhoneOtpInput(val);
                        if (val.length === 6) {
                          handleVerifyCheckoutOtp(val);
                        }
                      }}
                      placeholder="e.g. 123456"
                      className="w-2/3 px-3.5 py-2.5 bg-orange-50/50 border-2 border-orange-300 rounded-xl font-mono text-center font-black tracking-[6px] text-base outline-none focus:border-brand-orange-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyCheckoutOtp()}
                      disabled={phoneOtpVerifying || phoneOtpInput.length !== 6}
                      className="w-1/3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all shadow-md shadow-brand-orange-500/20 cursor-pointer"
                    >
                      {phoneOtpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{phoneOtpVerifying ? 'Verifying...' : 'Verify OTP'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    OTP sent to: <strong>+91 {formData.phone}</strong>. Code valid for 15 minutes.
                  </p>
                </div>
              )}
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
                  {!user && (
                    <button
                      type="button"
                      onClick={() => handleSendCheckoutOtp()}
                      disabled={phoneOtpSending || (formData.phone || '').replace(/\D/g, '').length < 10}
                      className="text-[11px] font-bold text-brand-orange-500 hover:text-brand-orange-600 disabled:opacity-40 cursor-pointer flex items-center space-x-1"
                    >
                      {phoneOtpSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{phoneOtpSending ? 'Sending...' : '⚡ Verify via OTP'}</span>
                    </button>
                  )}
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
        </div>

        {/* Right Order Review */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base">Review Items ({cartItems.length})</h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block truncate max-w-[180px]">{item.name}</span>
                  <span className="text-slate-400">Qty: {item.quantity} {item.isWholesale ? (item.box_unit || 'Unit') : (item.strip_unit || item.unit || 'Unit')} × ₹{item.price}</span>
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

          {!user ? (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = (formData.phone || '').replace(/\D/g, '');
                  if (cleanPhone.length === 10) {
                    if (!phoneOtpSent) {
                      handleSendCheckoutOtp(cleanPhone);
                    } else {
                      window.scrollTo({ top: 100, behavior: 'smooth' });
                      toast('Please enter the 6-digit SMS OTP above to verify & place your order.', { icon: '🔑' });
                    }
                  } else {
                    window.scrollTo({ top: 100, behavior: 'smooth' });
                    toast.error('Please enter your 10-digit mobile number above to receive OTP.');
                  }
                }}
                className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {phoneOtpSent
                    ? `Enter 6-Digit OTP Above to Complete Order • ₹${payableTotal.toFixed(2)}`
                    : `⚡ Verify OTP & Place Order • ₹${payableTotal.toFixed(2)}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-slate-500">
                Want to sign in with password instead?{' '}
                <Link to="/login?redirect=/checkout" className="text-brand-blue-800 font-bold hover:underline">
                  Password Login
                </Link>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </form>
    </div>
  );
}

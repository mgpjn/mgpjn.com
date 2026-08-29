import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalSavings,
    deliveryCharge,
    finalTotal,
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our wide range of tablets, syrups, multivitamins, and ayurvedic remedies.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-brand-blue-800 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-brand-blue-900"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 tracking-tight">
        Shopping Cart ({cartItems.length} Items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Item List */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm divide-y divide-slate-100">
          {cartItems.map((item) => (
            <div key={item.id} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-2xl border border-slate-100 flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.isWholesale
                      ? `📦 Box Packaging: ${item.box_packing || '1 Box (10 Strips)'}`
                      : `💊 ${item.dosage_form} • ${item.strip_packing || item.pack_size || '1 Strip'}`}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs font-black text-brand-blue-900">
                      ₹{item.effectiveUnitPrice || item.price} {item.isWholesale ? '/ Box' : '/ Strip'}
                    </p>
                    {item.isWholesale && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Wholesale (Box)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6">
                {/* Quantity */}
                <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-800 px-1 text-center">
                    {item.quantity} {item.isWholesale ? (item.box_unit || 'Box') : (item.strip_unit || 'Strip')}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-brand-blue-900">
                    ₹{((item.effectiveUnitPrice || item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-300 hover:text-rose-500 p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base">Order Summary</h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Item Total</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Savings</span>
                <span>-₹{totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span>{deliveryCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryCharge}`}</span>
            </div>
            <div className="pt-3 border-t flex justify-between text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-brand-blue-900">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

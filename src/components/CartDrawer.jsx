import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cartItems,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalSavings,
    deliveryCharge,
    finalTotal,
  } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 bg-slate-50 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-blue-800" />
              <h3 className="font-bold text-slate-800 text-base">Your Cart ({cartItems.length} items)</h3>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="bg-brand-blue-50 px-5 py-2.5 border-b border-brand-blue-100 text-xs">
            {subtotal >= 500 ? (
              <p className="text-emerald-700 font-bold flex items-center space-x-1.5">
                <span>🎉 You unlocked <strong>FREE Express Delivery</strong>!</span>
              </p>
            ) : (
              <p className="text-brand-blue-900 font-medium">
                Add <strong>₹{500 - subtotal}</strong> more to get <strong>FREE Delivery</strong>!
              </p>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-700">Your cart is empty</h4>
                <p className="text-xs text-slate-400">Add medicines, healthcare products or vitamins to your cart.</p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/shop');
                  }}
                  className="bg-brand-blue-800 text-white px-5 py-2 rounded-xl text-xs font-bold mt-2"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex items-start space-x-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {item.isWholesale
                        ? (item.box_packing || (item.box_unit ? `1 ${item.box_unit}` : 'Wholesale Pack'))
                        : (item.strip_packing || item.pack_size || item.subtitle || (item.strip_unit ? `1 ${item.strip_unit}` : '1 Unit'))}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-brand-blue-900">
                          ₹{item.itemTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ₹{item.effectiveUnitPrice.toFixed(2)} / {item.isWholesale ? (item.box_unit || 'Unit') : (item.strip_unit || item.unit || 'Unit')}
                        </div>
                        {item.isWholesale && (
                          <span className="inline-block text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            Wholesale Rate Applied!
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-white flex items-center justify-center text-slate-600 shadow-sm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 px-1 text-center whitespace-nowrap">
                          {item.quantity} {item.isWholesale ? (item.box_unit || 'Unit') : (item.strip_unit || item.unit || 'Unit')}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-white flex items-center justify-center text-slate-600 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-slate-50 border-t space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Total Discount Savings</span>
                    <span>-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span>{deliveryCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t">
                  <span>Final Amount</span>
                  <span className="text-brand-blue-800">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

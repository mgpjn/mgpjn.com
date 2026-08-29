import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((item) => item.id === product.id);

  const retailPrice = Number(product.price || product.retail_price || 0);
  const wholesalePrice = Number(product.wholesale_price || (retailPrice * 0.55));
  const mrp = Number(product.mrp || (retailPrice * 1.35));
  const discount = Math.round(((mrp - retailPrice) / mrp) * 100);

  // Deterministic ratings and reviews for clean 1mg style presentation
  const idNum = typeof product.id === 'number' ? product.id : (product.id ? String(product.id).charCodeAt(0) : 7);
  const rating = ((4.2 + (idNum % 7) * 0.1)).toFixed(1);
  const reviewCount = ((idNum * 173) % 2200) + 180;

  // Clean pack format (e.g., jar of 400 gm Powder, bottle of 30 tablets)
  const getPackSubtitle = (p) => {
    if (p.packaging_size) return p.packaging_size;
    const form = (p.dosage_form || 'Tablets').toLowerCase();
    if (form.includes('tablet')) return 'strip of 10 tablets';
    if (form.includes('capsule')) return 'strip of 10 capsules';
    if (form.includes('syrup')) return 'bottle of 100 ml Syrup';
    if (form.includes('injection')) return 'vial of 1 injection';
    if (form.includes('ointment') || form.includes('cream')) return 'tube of 30 gm Cream';
    if (form.includes('powder')) return 'jar of 400 gm Powder';
    if (form.includes('drop')) return 'bottle of 10 ml Drops';
    return p.subtitle || 'pack of 1 unit';
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-200 p-3 sm:p-4 flex flex-col justify-between h-full relative">
      <div>
        {/* Product Image Area */}
        <Link
          to={`/product/${product.slug || product.id}`}
          className="block relative h-36 sm:h-44 w-full flex items-center justify-center p-2 mb-2 bg-white rounded-xl overflow-hidden"
        >
          <img
            src={product.image || (Array.isArray(product.images) ? product.images[0] : null) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600';
            }}
          />

          {/* Rx Badge if required */}
          {product.is_prescription_required && (
            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
              Rx
            </span>
          )}
        </Link>

        {/* Product Name */}
        <Link to={`/product/${product.slug || product.id}`} className="block">
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors min-h-[2.4rem]">
            {product.name}
          </h3>
        </Link>

        {/* Pack Size / Subtitle */}
        <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-1 mb-1.5">
          {getPackSubtitle(product)}
        </p>

        {/* Ratings & Reviews (1mg Style 5-Star) */}
        <div className="flex items-center space-x-1 text-xs text-teal-800 font-semibold mb-1">
          <div className="flex items-center text-teal-700 space-x-0.5">
            <Star className="w-3 h-3 fill-teal-700 text-teal-700" />
            <Star className="w-3 h-3 fill-teal-700 text-teal-700" />
            <Star className="w-3 h-3 fill-teal-700 text-teal-700" />
            <Star className="w-3 h-3 fill-teal-700 text-teal-700" />
            <Star className="w-3 h-3 fill-teal-700 text-teal-700" />
          </div>
          <span className="text-[11px] font-bold text-teal-800 ml-1">{rating}</span>
          <span className="text-[10px] text-slate-400 font-normal">({reviewCount})</span>
        </div>

        {/* Delivery Estimate */}
        <p className="text-[11px] text-slate-600 font-normal mb-2">
          Get by <span className="font-semibold text-slate-800">8pm, Today</span>
        </p>
      </div>

      {/* Pricing & Cart Action Row */}
      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
        {/* Price & Discount */}
        <div>
          <div className="flex items-baseline space-x-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-slate-900">
              ₹{retailPrice.toFixed(0)}
            </span>
            {mrp > retailPrice && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                ₹{mrp.toFixed(0)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-[11px] sm:text-xs font-bold text-teal-600">
                {discount}% off
              </span>
            )}
          </div>
        </div>

        {/* Add / Quantity Button */}
        <div>
          {!cartItem ? (
            <button
              onClick={() => addToCart(product, 1)}
              className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center space-x-1"
            >
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center bg-teal-50 border border-teal-200 rounded-lg p-0.5">
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-5 h-5 rounded bg-white text-teal-800 shadow-xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-xs font-bold text-teal-900 px-2">{cartItem.quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-5 h-5 rounded bg-white text-teal-800 shadow-xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

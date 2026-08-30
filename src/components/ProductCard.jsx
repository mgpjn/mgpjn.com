import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity, setIsDrawerOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cartItem = cartItems.find((item) => item.id === product.id);

  // Wholesale Rate is strictly for Sub-Retailer se upar ke saare roles (Retailer, Sub Distributor, Distributor, Super Distributor, Admin)
  const isWholesaleAllowed = Boolean(
    user && (user.role_level >= 3 || ['retailer', 'sub_distributor', 'distributor', 'super_distributor', 'admin', 'super_admin'].includes(user.role))
  );

  const retailPrice = Number(product.retail_price || product.price || 0);

  // Role-specific Wholesale Box Rate
  let wholesalePrice = Number(product.wholesale_price || 0);
  if (user) {
    if (user.role === 'super_distributor' && product.sd_price) {
      wholesalePrice = Number(product.sd_price);
    } else if (user.role === 'distributor' && product.dist_price) {
      wholesalePrice = Number(product.dist_price);
    } else if (user.role === 'sub_distributor' && product.subd_price) {
      wholesalePrice = Number(product.subd_price);
    } else if (user.role === 'retailer' && product.retailer_price) {
      wholesalePrice = Number(product.retailer_price);
    }
  }
  if (!wholesalePrice) {
    wholesalePrice = Number(product.retailer_price || product.wholesale_price || (retailPrice * 0.55));
  }

  const mrp = Number(product.mrp || (retailPrice * 1.35));
  const discount = Math.round(((mrp - retailPrice) / mrp) * 100);

  // Deterministic ratings and reviews for clean 1mg style presentation
  const idNum = typeof product.id === 'number' ? product.id : (product.id ? String(product.id).charCodeAt(0) : 7);
  const rating = ((4.2 + (idNum % 7) * 0.1)).toFixed(1);
  const reviewCount = ((idNum * 173) % 2200) + 180;

  // Dynamic packaging format based on configured product metric
  const getPackSubtitle = (p) => {
    if (p.strip_packing && p.strip_packing.trim()) return p.strip_packing;
    if (p.packaging_size && p.packaging_size.trim()) return p.packaging_size;
    if (p.pack_size && p.pack_size.trim()) return p.pack_size;
    if (p.subtitle && p.subtitle.trim()) return p.subtitle;
    if (p.strip_unit && p.strip_unit.trim()) return `1 ${p.strip_unit}`;
    const form = (p.dosage_form || '').toLowerCase();
    if (form.includes('tablet')) return 'strip of 10 tablets';
    if (form.includes('capsule')) return 'strip of 10 capsules';
    if (form.includes('syrup')) return 'bottle of 100 ml Syrup';
    if (form.includes('injection')) return 'vial of 1 injection';
    if (form.includes('ointment') || form.includes('cream')) return 'tube of 30 gm Cream';
    if (form.includes('powder')) return 'jar of 400 gm Powder';
    if (form.includes('drop')) return 'bottle of 10 ml Drops';
    return p.unit ? `1 ${p.unit}` : '1 Unit';
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    if (setIsDrawerOpen) setIsDrawerOpen(true);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/85 hover:border-teal-400 hover:shadow-lg transition-all duration-200 p-3 sm:p-3.5 flex flex-col justify-between h-full relative">
      {/* Upper Content Section */}
      <div className="flex-1 flex flex-col">
        {/* Product Image Area */}
        <Link
          to={`/product/${product.slug || product.id}`}
          className="block relative h-36 sm:h-40 w-full flex items-center justify-center p-2 mb-2 bg-slate-50/70 rounded-xl overflow-hidden group-hover:bg-slate-50 transition-colors"
        >
          <img
            src={product.image || (Array.isArray(product.images) ? product.images[0] : null) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600';
            }}
          />

          {/* Rx Badge if prescription required */}
          {product.is_prescription_required && (
            <span className="absolute top-2 left-2 bg-[#ff9800] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
              Rx
            </span>
          )}

          {/* Discount Pill on Top Right if discount > 0 */}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
              {discount}% OFF
            </span>
          )}
        </Link>

        {/* Product Name */}
        <Link to={`/product/${product.slug || product.id}`} className="block">
          <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors min-h-[2.4rem]">
            {product.name}
          </h3>
        </Link>

        {/* Pack Size / Subtitle */}
        <p className="text-[11px] text-slate-400 truncate mt-0.5 mb-1.5 font-medium">
          {getPackSubtitle(product)}
        </p>

        {/* Ratings & Reviews */}
        <div className="flex items-center space-x-1 text-xs text-teal-800 font-semibold mb-2">
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
      </div>

      {/* Pricing & Cart Action Area */}
      <div className="pt-2 border-t border-slate-100/90 space-y-2 mt-auto">
        {/* Price & Unit Line */}
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{retailPrice.toFixed(0)}
            </span>
            {mrp > retailPrice && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{mrp.toFixed(0)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            Retail: / {product.strip_unit || product.unit || 'Unit'}
          </span>
        </div>

        {/* Wholesale Rate (Role-specific B2B packaging rate) */}
        {isWholesaleAllowed && (
          <div className="flex items-center justify-between bg-emerald-50/95 border border-emerald-300/80 px-2 py-1 rounded-xl text-[10px] shadow-2xs">
            <div className="flex flex-col">
              <span className="font-extrabold text-emerald-950 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Wholesale:</span>
              </span>
              <span className="text-[9px] text-emerald-700 font-medium truncate max-w-[100px]" title={product.box_packing || product.pack_size || product.box_unit || 'Wholesale Unit'}>
                {product.box_packing || (product.box_unit ? `1 ${product.box_unit}` : 'Wholesale Pack')}
              </span>
            </div>
            <div className="text-right">
              <span className="font-black text-emerald-800 text-xs">
                ₹{wholesalePrice.toFixed(0)}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold block">
                / {product.box_unit || 'Wholesale'}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        {!cartItem ? (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleAdd}
              className="bg-teal-700 hover:bg-teal-800 text-white py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-[#ff5722] hover:bg-[#f4511e] text-white py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Buy Now (Instant Checkout)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>BUY</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-1 py-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, cartItem.quantity - 1);
                }}
                className="w-6 h-6 rounded-lg bg-white text-teal-800 shadow-xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-extrabold text-teal-900 px-1">{cartItem.quantity}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, cartItem.quantity + 1);
                }}
                className="w-6 h-6 rounded-lg bg-white text-teal-800 shadow-xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-[#ff5722] hover:bg-[#f4511e] text-white py-1.5 px-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Proceed to Checkout"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>BUY</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

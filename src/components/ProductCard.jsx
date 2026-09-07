import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Star, Zap, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ShareProductModal from './ShareProductModal';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity, setIsDrawerOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  // Wholesale MRP & Profit Margin Calculation for Wholesaler / Retailer / Distributor
  const wholesaleMrp = Number(
    product.wholesale_mrp || (product.mrp ? product.mrp * 10 : (wholesalePrice * 1.5))
  );
  const wholesaleDiscount = wholesaleMrp > wholesalePrice 
    ? Math.round(((wholesaleMrp - wholesalePrice) / wholesaleMrp) * 100) 
    : 0;
  const wholesaleSavings = Math.max(0, wholesaleMrp - wholesalePrice);

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
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-teal-500 hover:shadow-md transition-all duration-200 p-2 sm:p-3.5 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Upper Content Section */}
      <div className="flex-1 flex flex-col">
        {/* Product Image Area */}
        <Link
          to={`/product/${product.slug || product.id}`}
          className="block relative h-32 sm:h-40 w-full flex items-center justify-center p-1.5 sm:p-2 mb-1.5 sm:mb-2 bg-slate-50/80 rounded-lg sm:rounded-xl overflow-hidden group-hover:bg-slate-50 transition-colors"
        >
          <img
            src={product.image || (Array.isArray(product.images) ? product.images[0] : null) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600';
            }}
          />

          {/* Quick Share Button (Always accessible on mobile, reveals on hover on desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsShareModalOpen(true);
            }}
            title="Share this medicine"
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 sm:bg-white/80 hover:bg-white text-slate-500 hover:text-emerald-600 shadow-2xs flex items-center justify-center transition-all z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Rx Badge if prescription required */}
          {product.is_prescription_required && (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#ff9800] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
              Rx
            </span>
          )}

          {/* Discount Pill on Top Left if discount > 0 (or beside Rx) */}
          {discount > 0 && !product.is_prescription_required && (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
              {discount}% OFF
            </span>
          )}
        </Link>

        {/* Product Name */}
        <Link to={`/product/${product.slug || product.id}`} className="block">
          <h3 className="font-bold text-slate-900 text-[11px] sm:text-[13px] line-clamp-2 leading-tight sm:leading-snug min-h-[1.9rem] sm:min-h-[2.4rem] group-hover:text-teal-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Pack Size / Subtitle */}
        <p className="text-[9px] sm:text-[11px] text-slate-400 truncate mt-0.5 mb-1 font-medium">
          {getPackSubtitle(product)}
        </p>

        {/* Ratings & Reviews - Compact clean pill */}
        <div className="flex items-center space-x-1 text-xs text-teal-800 font-semibold mb-1.5">
          <div className="inline-flex items-center bg-teal-50 border border-teal-100/80 text-teal-800 px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-teal-600 text-teal-600 mr-0.5" />
            <span>{rating}</span>
          </div>
          <span className="text-[8px] sm:text-[10px] text-slate-400 font-normal truncate">({reviewCount})</span>
        </div>
      </div>

      {/* Pricing & Cart Action Area */}
      <div className="pt-1.5 sm:pt-2 border-t border-slate-100/90 space-y-1.5 sm:space-y-2 mt-auto">
        {/* Price & Unit Line */}
        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline space-x-1 sm:space-x-1.5">
            <span className="text-xs sm:text-base md:text-lg font-black text-slate-900">
              ₹{retailPrice.toFixed(0)}
            </span>
            {mrp > retailPrice && (
              <span className="text-[9px] sm:text-[11px] text-slate-400 line-through">
                ₹{mrp.toFixed(0)}
              </span>
            )}
          </div>
          <span className="text-[8px] sm:text-[10px] text-slate-500 font-semibold truncate">
            /{product.strip_unit || product.unit || 'Strip'}
          </span>
        </div>

        {/* Wholesale Rate (Role-specific B2B packaging rate with Wholesale MRP & Discount) */}
        {isWholesaleAllowed && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-300/90 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[8px] sm:text-[9px]">
                  Wholesale
                </span>
              </div>
              {wholesaleDiscount > 0 && (
                <span className="bg-emerald-600 text-white font-black text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded shadow-2xs">
                  {wholesaleDiscount}% OFF
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-0.5 gap-1">
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] sm:text-[9px] text-emerald-800 font-bold truncate max-w-[80px] sm:max-w-[120px]" title={product.box_packing || product.box_unit || 'Wholesale Unit'}>
                  📦 {product.box_packing || (product.box_unit ? `1 ${product.box_unit}` : 'Bulk')}
                </span>
                {wholesaleSavings > 0 && (
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-emerald-700 truncate">
                    Save ₹{wholesaleSavings.toFixed(0)}
                  </span>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline justify-end space-x-1">
                  <span className="font-black text-emerald-900 text-[11px] sm:text-sm">
                    ₹{wholesalePrice.toFixed(0)}
                  </span>
                  {wholesaleMrp > wholesalePrice && (
                    <span className="text-[8px] sm:text-[9px] text-slate-400 line-through">
                      ₹{wholesaleMrp.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        {!cartItem ? (
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleAdd}
              className="bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white h-7 sm:h-9 px-1 sm:px-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>ADD</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-[#ff5722] hover:bg-[#f4511e] active:bg-[#e64a19] text-white h-7 sm:h-9 px-1 sm:px-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Buy Now (Instant Checkout)"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>BUY</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 pt-0.5">
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg sm:rounded-xl h-7 sm:h-9 px-0.5 sm:px-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, cartItem.quantity - 1);
                }}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white text-teal-800 shadow-2xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs cursor-pointer"
              >
                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <span className="text-[10px] sm:text-xs font-extrabold text-teal-900 px-0.5 sm:px-1">{cartItem.quantity}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, cartItem.quantity + 1);
                }}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white text-teal-800 shadow-2xs flex items-center justify-center font-bold hover:bg-teal-700 hover:text-white transition-colors text-xs cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-[#ff5722] hover:bg-[#f4511e] active:bg-[#e64a19] text-white h-7 sm:h-9 px-1 sm:px-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              title="Proceed to Checkout"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>BUY</span>
            </button>
          </div>
        )}
      </div>

      {/* Share Product Modal */}
      <ShareProductModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />
    </div>
  );
}

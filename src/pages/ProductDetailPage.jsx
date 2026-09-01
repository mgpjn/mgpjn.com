import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, ShieldCheck, Truck, Clock,
  FileText, Check, AlertCircle, Sparkles, ChevronRight, ChevronLeft, Share2, Package, Tag,
  Pill, Award, CheckCircle2, Info, Activity, ZoomIn
} from 'lucide-react';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ShareProductModal from '../components/ShareProductModal';

export default function ProductDetailPage({ onOpenPrescriptionModal }) {
  const params = useParams();
  const navigate = useNavigate();
  const idOrSlug = params.slug || params.idOrSlug || params.id;
  const { user } = useAuth();
  const { addToCart, setIsDrawerOpen } = useCart();
  // Wholesale / Bulk Rate is strictly reserved for sub-retailer se upar ke saare roles (Retailers, Sub Distributors, Distributors, Super Distributors, Admins)
  const isWholesaleAllowed = Boolean(
    user && (user.role_level >= 3 || ['retailer', 'sub_distributor', 'distributor', 'super_distributor', 'admin', 'super_admin'].includes(user.role))
  );

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [pricingMode, setPricingMode] = useState('retail'); // 'retail' or 'wholesale'
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const allImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    return product.image ? [product.image] : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'];
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!idOrSlug) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setLoading(true);
    getProduct(idOrSlug)
      .then((res) => {
        if (res.data.success) {
          const p = res.data.product;
          setProduct(p);
          setRelated(res.data.related || []);
          if (isWholesaleAllowed) {
            setPricingMode('wholesale');
            setQuantity(p.wholesale_min_qty || 5);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [idOrSlug, isWholesaleAllowed]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="w-32 h-8 bg-slate-200 rounded-xl mx-auto"></div>
        <div className="w-96 h-6 bg-slate-100 rounded-lg mx-auto"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <Link to="/shop" className="text-brand-blue-800 font-bold text-xs underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

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

  const wholesaleMinQty = product.wholesale_min_qty || 5;
  const mrp = Number(product.mrp || (retailPrice * 1.35));

  const isWholesaleSelected = isWholesaleAllowed && (pricingMode === 'wholesale' || quantity >= wholesaleMinQty);
  const currentUnitPrice = isWholesaleSelected ? wholesalePrice : retailPrice;
  const currentTotal = currentUnitPrice * quantity;

  const handleSelectMode = (mode) => {
    if (!isWholesaleAllowed) return;
    setPricingMode(mode);
    if (mode === 'wholesale' && quantity < wholesaleMinQty) {
      setQuantity(wholesaleMinQty);
    } else if (mode === 'retail' && quantity >= wholesaleMinQty) {
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedAnimation(true);
    if (setIsDrawerOpen) setIsDrawerOpen(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const saltDetails = product.salt_composition_details || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-600">Home</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link to="/shop" className="hover:text-slate-600">Medicines</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-slate-800 font-semibold truncate">{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Image Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center group shadow-xs">
            <img
              src={allImages[activeImageIndex] || product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'}
              alt={`${product.name} - View ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800';
              }}
            />
            {product.discount_percentage > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-10">
                {product.discount_percentage}% OFF
              </span>
            )}
            
            {/* Quick Floating Share Button on Image */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              title="Share this product"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 shadow-md flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Prev / Next navigation arrows if multiple images */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all z-10"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all z-10"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full z-10">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Gallery Strip (If 2 or more images) */}
          {allImages.length > 1 && (
            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all p-0.5 bg-white ${
                    activeImageIndex === idx
                      ? 'border-brand-blue-800 ring-2 ring-brand-blue-800/30 scale-105 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800';
                    }}
                  />
                  {activeImageIndex === idx && (
                    <span className="absolute bottom-0 inset-x-0 bg-brand-blue-800 text-[8px] font-bold text-white text-center py-0.5">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>100% Genuine Medicine with Batch Certificate &amp; Expiry verified.</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>WHO-GMP Certified &amp; CDSCO Compliant Formulation.</span>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-blue-800 bg-brand-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                {product.category?.name || 'Pharmacy'} • {product.dosage_form}
              </span>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share Product</span>
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              {product.name}
            </h1>

            {/* Quick Salt Composition Banner */}
            <div className="mt-2.5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                Active Chemical / Salt Formulation:
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {product.composition || product.subtitle || 'Active Pharmaceutical Formula'}
              </p>
            </div>
          </div>

          {/* Pricing Display */}
          {isWholesaleAllowed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Choose Purchase Mode:
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  B2B Trade Pricing Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Normal Retail Rate */}
                <div
                  onClick={() => handleSelectMode('retail')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    pricingMode === 'retail' && quantity < wholesaleMinQty
                      ? 'border-brand-blue-800 bg-brand-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-blue-800" />
                      <span>Retail Rate (per {product.strip_unit || product.unit || 'Unit'})</span>
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {product.strip_unit || product.unit || 'Unit'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-900">₹{retailPrice.toFixed(2)}</span>
                    <span className="text-xs text-slate-500 font-bold">/ {product.strip_unit || product.unit || 'Unit'}</span>
                    {mrp > retailPrice && (
                      <span className="text-xs text-slate-400 line-through">MRP ₹{mrp.toFixed(2)}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    💊 Packing: {product.strip_packing || product.pack_size || product.packaging_size || (`1 ${product.strip_unit || 'Unit'}`)}
                  </p>
                </div>

                {/* Option 2: Wholesale / Bulk Rate */}
                <div
                  onClick={() => handleSelectMode('wholesale')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isWholesaleSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-800 flex items-center space-x-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Wholesale Rate (per {product.box_unit || 'Wholesale Unit'})</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                      {product.box_unit || 'Wholesale'} Packing
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-emerald-800">₹{wholesalePrice.toFixed(2)}</span>
                    <span className="text-xs text-emerald-700 font-extrabold">/ {product.box_unit || 'Wholesale'}</span>
                    <span className="text-xs text-emerald-600 font-bold">
                      (Wholesale Trade)
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-bold mt-1">
                    📦 Packing: {product.box_packing || (`1 ${product.box_unit || 'Wholesale Pack'}`)}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    B2B Trade Rate for stockists, chemists &amp; bulk buyers
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-slate-900">₹{retailPrice.toFixed(2)}</span>
                {mrp > retailPrice && (
                  <span className="text-sm text-slate-400 line-through">MRP ₹{mrp.toFixed(2)}</span>
                )}
                {mrp > retailPrice && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                    Save {Math.round(((mrp - retailPrice) / mrp) * 100)}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Inclusive of all GST taxes • Safe &amp; verified medicine dispatch
              </p>
            </div>
          )}

          {/* Rx Warning */}
          {product.is_prescription_required && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-rose-800 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Doctor's Prescription (Rx) Required for this medicine.</span>
              </div>
              <button
                onClick={onOpenPrescriptionModal}
                className="text-brand-blue-800 font-extrabold underline ml-2 whitespace-nowrap"
              >
                Upload Rx
              </button>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Quantity ({isWholesaleSelected ? (product.box_unit || 'Wholesale Unit') : (product.strip_unit || product.unit || 'Unit')}):
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isWholesaleSelected
                    ? `📦 Wholesale: ${product.box_packing || (product.box_unit ? '1 ' + product.box_unit : 'Bulk Pack')}`
                    : `💊 Retail: ${product.strip_packing || product.pack_size || (product.strip_unit ? '1 ' + product.strip_unit : '1 Unit')}`}
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center font-bold hover:bg-brand-blue-800 hover:text-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-extrabold text-slate-800 px-1 text-center">
                  {quantity} {isWholesaleSelected ? (product.box_unit || 'Unit') : (product.strip_unit || product.unit || 'Unit')}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 500, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center font-bold hover:bg-brand-blue-800 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Price:</span>
                <span className="text-xl font-black text-brand-blue-900">₹{currentTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleAddToCart}
                className={`py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-brand-blue-800 hover:bg-brand-blue-900 text-white shadow-brand-blue-800/20'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add {quantity} {isWholesaleSelected ? 'Boxes' : 'Packs'} to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 text-center cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buy Now with 1-Click</span>
              </button>
            </div>

            {/* Share Product Action Bar */}
            <div className="pt-3 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 rounded-2xl text-emerald-950 font-black text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Share2 className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-slate-900 text-xs">Share Product &amp; Earn Downline Commission</span>
                    <span className="block text-[10px] text-emerald-700 font-medium">Send genuine medicine link directly on WhatsApp, Facebook, etc.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-emerald-700 font-extrabold text-xs">
                  <span>Share Now</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🧬 DEDICATED ACTIVE SALT COMPOSITION & CHEMICAL BREAKDOWN SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-brand-blue-50 text-brand-blue-800 flex items-center justify-center font-bold">
            <Pill className="w-5 h-5 text-brand-blue-800" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Active Pharmaceutical Ingredients (API) &amp; Salt Composition Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Accurate molecular formulation, strength per unit dose, and therapeutic classifications.
            </p>
          </div>
        </div>

        {saltDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
                <tr>
                  <th className="p-3">Molecule / Active Salt Name</th>
                  <th className="p-3">Strength / Quantity</th>
                  <th className="p-3">Ratio / Percentage (%)</th>
                  <th className="p-3">Therapeutic Action / Clinical Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saltDetails.map((salt, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-brand-blue-700"></span>
                      <span>{salt.salt_name}</span>
                    </td>
                    <td className="p-3 font-extrabold text-brand-blue-800">
                      <span className="bg-brand-blue-50 px-2.5 py-1 rounded-lg border border-brand-blue-100">
                        {salt.strength}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700">
                      <div className="flex items-center space-x-2">
                        <span>{salt.percentage || 'N/A'}</span>
                        {salt.percentage && (
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, parseFloat(salt.percentage) || 50)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {salt.therapeutic_class || 'Active Chemical Compound'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600">
            <strong>Formula:</strong> {product.composition || 'Standard Certified Pharmaceutical Salt Matrix'}
          </div>
        )}

        {/* Product Description & Clinical Indications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-brand-blue-800" />
              <span>Pharmaceutical Description &amp; Quality</span>
            </h4>
            <p>{product.description || 'Manufactured under strict GMP certified pharmaceutical conditions for maximum safety, bioavailability, and clinical efficacy.'}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Indications &amp; Medical Usage</span>
            </h4>
            <p>{product.indications || 'Recommended for approved clinical treatment as directed by a registered medical practitioner.'}</p>
          </div>
        </div>
      </div>

      {/* Related Medicines */}
      {related.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-slate-900">Similar Medicines &amp; Healthcare Formulations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* Share Product Modal */}
      <ShareProductModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />
    </div>
  );
}

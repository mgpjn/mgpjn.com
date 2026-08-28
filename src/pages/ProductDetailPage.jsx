import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, ShieldCheck, Truck, Clock,
  FileText, Check, AlertCircle, Sparkles, ChevronRight, Share2, Package, Tag,
  Pill, Award, CheckCircle2, Info, Activity
} from 'lucide-react';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage({ onOpenPrescriptionModal }) {
  const params = useParams();
  const idOrSlug = params.slug || params.idOrSlug || params.id;
  const { user } = useAuth();
  const { addToCart, isB2BPartner } = useCart();
  const isWholesaleAllowed = user && ['retailer', 'sub_distributor', 'distributor', 'super_distributor', 'admin', 'super_admin'].includes(user.role);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [pricingMode, setPricingMode] = useState('retail'); // 'retail' or 'wholesale'
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (!idOrSlug) return;
    setLoading(true);
    getProduct(idOrSlug)
      .then((res) => {
        if (res.data.success) {
          const p = res.data.product;
          setProduct(p);
          setRelated(res.data.related || []);
          if (isB2BPartner) {
            setPricingMode('wholesale');
            setQuantity(p.wholesale_min_qty || 5);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [idOrSlug, isB2BPartner]);

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

  const retailPrice = Number(product.price || product.retail_price || 0);
  const wholesalePrice = Number(product.wholesale_price || (retailPrice * 0.55));
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
    setTimeout(() => setAddedAnimation(false), 1500);
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
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800';
              }}
            />
            {product.discount_percentage > 0 && (
              <span className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                {product.discount_percentage}% OFF
              </span>
            )}
            <span className="absolute top-4 left-4 bg-brand-blue-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
              Batch Tested
            </span>
          </div>

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
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-brand-blue-800 bg-brand-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                {product.category?.name || 'Pharmacy'} • {product.dosage_form}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {product.pack_size}
              </span>
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
                      <span>Retail Rate</span>
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Single Pack
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-900">₹{retailPrice.toFixed(2)}</span>
                    {mrp > retailPrice && (
                      <span className="text-xs text-slate-400 line-through">MRP ₹{mrp.toFixed(2)}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">For normal patient &amp; retail consumption</p>
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
                      <span>Wholesale / Bulk Rate</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                      {wholesaleMinQty}+ Units
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-emerald-800">₹{wholesalePrice.toFixed(2)}</span>
                    <span className="text-xs text-emerald-600 font-bold">
                      (Save {Math.round((1 - wholesalePrice / mrp) * 100)}% on MRP)
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
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
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Quantity:</span>
                <span className="text-[11px] text-slate-400">
                  {isWholesaleSelected ? `Wholesale active (${wholesaleMinQty}+ units)` : 'Retail active'}
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center font-bold hover:bg-brand-blue-800 hover:text-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-extrabold text-slate-800 w-8 text-center">{quantity}</span>
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
                className={`py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
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
                    <span>Add {quantity} Packs to Cart</span>
                  </>
                )}
              </button>

              <Link
                to="/checkout"
                onClick={() => addToCart(product, quantity)}
                className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-brand-orange-500/20 flex items-center justify-center space-x-2 text-center"
              >
                <span>Buy Now with 1-Click</span>
              </Link>
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
    </div>
  );
}

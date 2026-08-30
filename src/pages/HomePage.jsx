import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill, Activity, Sparkles, ShieldCheck, Truck, Clock,
  ChevronRight, Percent, Award, HeartHandshake, PhoneCall,
  Search, Upload, CheckCircle2, Flame
} from 'lucide-react';
import { getCategories, getFeaturedProducts, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_HOT_SELLING,
  FALLBACK_FEATURED,
  FALLBACK_TOP_DISCOUNTS
} from '../data/fallbackProducts';

export default function HomePage({ onOpenPrescriptionModal }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [featuredData, setFeaturedData] = useState({
    featured: FALLBACK_FEATURED,
    topDiscounts: FALLBACK_TOP_DISCOUNTS,
    hotSelling: FALLBACK_HOT_SELLING
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          getCategories(),
          getFeaturedProducts()
        ]);

        if (!isMounted) return;

        if (catRes.status === 'fulfilled' && catRes.value?.data?.success && Array.isArray(catRes.value.data.categories) && catRes.value.data.categories.length > 0) {
          setCategories(catRes.value.data.categories);
        }

        let featuredResult = null;
        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
          featuredResult = prodRes.value.data;
        }

        const hasHotSelling = featuredResult?.hotSelling && featuredResult.hotSelling.length > 0;
        const hasFeatured = featuredResult?.featured && featuredResult.featured.length > 0;

        // If backend returned empty featured/hotSelling, try fetching general active products
        if (!hasHotSelling && !hasFeatured) {
          try {
            const fallbackRes = await getProducts({ per_page: 24 });
            const list = fallbackRes?.data?.products?.data || fallbackRes?.data?.data || fallbackRes?.data?.products || [];
            if (Array.isArray(list) && list.length > 0) {
              featuredResult = {
                hotSelling: list.slice(0, 8),
                featured: list.slice(0, 12),
                topDiscounts: list.filter(p => (p.discount_percentage || 0) >= 15).slice(0, 8),
                trending: list.slice(0, 8)
              };
            }
          } catch (e) {
            console.warn('Backend products fetch warning:', e);
          }
        }

        if (isMounted && featuredResult && (featuredResult.hotSelling?.length > 0 || featuredResult.featured?.length > 0)) {
          setFeaturedData({
            featured: (featuredResult.featured && featuredResult.featured.length > 0) ? featuredResult.featured : FALLBACK_FEATURED,
            topDiscounts: (featuredResult.topDiscounts && featuredResult.topDiscounts.length > 0) ? featuredResult.topDiscounts : FALLBACK_TOP_DISCOUNTS,
            hotSelling: (featuredResult.hotSelling && featuredResult.hotSelling.length > 0) ? featuredResult.hotSelling : FALLBACK_HOT_SELLING
          });
        }
      } catch (err) {
        console.error('HomePage loading error:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const hotSellingList = (featuredData?.hotSelling && featuredData.hotSelling.length > 0)
    ? featuredData.hotSelling
    : FALLBACK_HOT_SELLING;

  const featuredList = (featuredData?.featured && featuredData.featured.length > 0)
    ? featuredData.featured
    : FALLBACK_FEATURED;

  const topDiscountsList = (featuredData?.topDiscounts && featuredData.topDiscounts.length > 0)
    ? featuredData.topDiscounts
    : FALLBACK_TOP_DISCOUNTS;

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 pt-4">
      {/* 1. 🔥 HOT SELLING PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 p-4 sm:p-6 md:p-8 rounded-3xl border border-orange-200/60 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-black text-white bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-1 rounded-full shadow-sm mb-1.5 sm:mb-2 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-white text-white" />
                <span>🔥 HOT SELLING • HIGH DEMAND</span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Top Fast-Moving Medicines</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 hidden xs:block">
                Most ordered pharmaceutical products by clinics, chemists &amp; patients this week.
              </p>
            </div>
            <Link to="/shop" className="hidden sm:flex text-xs font-bold text-rose-700 hover:text-rose-900 items-center space-x-1">
              <span>View All Hot Deals</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {hotSellingList.slice(0, 10).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Featured & Trending Medicines */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-orange-600 bg-brand-orange-50 px-2.5 py-1 rounded-full mb-1 sm:mb-2">
              <Percent className="w-3.5 h-3.5" />
              <span>Super Deals &amp; Best Sellers</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Featured Pharmaceutical Products
            </h2>
          </div>
          <Link to="/shop" className="hidden sm:flex text-xs font-bold text-brand-blue-800 hover:text-brand-blue-900 items-center space-x-1">
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {featuredList.slice(0, 10).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 3. Top Discount Deals (Up to 30% Off) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-rose-600 uppercase tracking-widest block mb-0.5 sm:mb-1">
              Save Big On Healthcare
            </span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Medicines with 20% to 30% Flat Discount
            </h2>
          </div>
          <Link to="/shop?sort=discount" className="hidden sm:flex text-xs font-bold text-brand-blue-800 hover:text-brand-blue-900 items-center space-x-1">
            <span>View All Deals</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {topDiscountsList.slice(0, 10).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 4. Quality Assurance & Trust Healthcare Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-blue-950 via-slate-900 to-brand-blue-900 p-6 sm:p-8 md:p-12 text-white overflow-hidden shadow-xl">
          <div className="max-w-3xl space-y-3 sm:space-y-4 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-brand-orange-400 uppercase tracking-widest">
              MediGlaxo Quality &amp; Trust Assurance
            </span>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight leading-tight">
              100% Genuine Medicines with Certified Cold-Chain Logistics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every medication in our catalog is sourced directly from licensed pharmaceutical manufacturers, inspected by registered pharmacists, and delivered in temperature-controlled packaging to preserve efficacy.
            </p>
            <div className="pt-2 sm:pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                <h4 className="font-bold text-xs">WHO-GMP Sourced</h4>
                <p className="text-[11px] text-slate-300">Certified authentic generic formulas.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange-400" />
                <h4 className="font-bold text-xs">Express Delivery</h4>
                <p className="text-[11px] text-slate-300">Fast doorstep dispatch within 24-48h.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                <h4 className="font-bold text-xs">Pharmacist Checked</h4>
                <p className="text-[11px] text-slate-300">Every prescription verified before dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HERO & PRESCRIPTION DISPATCH BANNER (AT THE BOTTOM) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-brand-blue-800 text-white py-10 md:py-16 rounded-3xl max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        <div className="px-6 sm:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Licensed Healthcare &amp; Express Pharmacy</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Authentic Medicines <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange-400 via-amber-300 to-yellow-200">
                  Delivered In 24 Hours.
                </span>
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Order genuine WHO-GMP certified pharmaceuticals, generic formulations, syrups, and chronic care medicines with verified batch certificates &amp; flat discounts.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  to="/shop"
                  className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-brand-orange-500/25 transition-all hover:scale-105"
                >
                  Explore Medicines Catalog →
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Genuine</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Free Express Delivery &gt; ₹500</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pharmacist Verified</span>
                </span>
              </div>
            </div>

            {/* Right Rx Card */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Order with Prescription</h4>
                    <p className="text-[11px] text-slate-400">Quick 3-step prescription dispatch</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-brand-blue-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Upload Doctor's Prescription</h5>
                      <p className="text-[11px] text-slate-500">Upload camera photo, PDF or document.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-brand-blue-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Pharmacist Verification</h5>
                      <p className="text-[11px] text-slate-500">Our pharmacist verifies dosage &amp; calls you.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-brand-blue-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Express Home Delivery</h5>
                      <p className="text-[11px] text-slate-500">Medicines delivered safely at your address.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill, Activity, Sparkles, ShieldCheck, Truck, Clock,
  ChevronRight, ChevronLeft, Percent, Award, HeartHandshake, PhoneCall,
  Search, Upload, CheckCircle2, Flame, Star, Tag, Layers, ArrowRight,
  Droplets, Syringe, Sparkle, Heart, RefreshCw, Zap
} from 'lucide-react';
import { getCategories, getHomepageData, getFeaturedProducts, getBanners } from '../services/api';
import ProductCard from '../components/ProductCard';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_HOT_SELLING,
  FALLBACK_FEATURED,
  FALLBACK_TOP_DISCOUNTS
} from '../data/fallbackProducts';

export default function HomePage({ onOpenPrescriptionModal }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [featuredData, setFeaturedData] = useState({
    featured: [],
    hotSelling: [],
    homepageGrid: [],
    topDiscounts: [],
    categoryShelves: [],
    settings: {}
  });
  const [loading, setLoading] = useState(true);
  const bannerTimerRef = useRef(null);
  const navigate = useNavigate();

  // Load all live homepage data from database
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [homeRes, catRes] = await Promise.allSettled([
          getHomepageData().catch(() => getFeaturedProducts()),
          getCategories()
        ]);

        if (!isMounted) return;

        if (catRes.status === 'fulfilled' && catRes.value?.data?.success && Array.isArray(catRes.value.data.categories)) {
          setCategories(catRes.value.data.categories);
        }

        if (homeRes.status === 'fulfilled' && homeRes.value?.data?.success) {
          const data = homeRes.value.data;
          setFeaturedData({
            featured: Array.isArray(data.featured) ? data.featured : [],
            hotSelling: Array.isArray(data.hotSelling) ? data.hotSelling : [],
            homepageGrid: Array.isArray(data.homepageGrid) ? data.homepageGrid : [],
            topDiscounts: Array.isArray(data.topDiscounts) ? data.topDiscounts : [],
            categoryShelves: Array.isArray(data.categoryShelves) ? data.categoryShelves : [],
            settings: data.settings || {}
          });

          if (Array.isArray(data.banners) && data.banners.length > 0) {
            setBanners(data.banners);
          }
        }
      } catch (err) {
        console.error('Error loading dynamic homepage:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, []);

  // Auto-rotate hero banners
  useEffect(() => {
    if (banners.length > 1) {
      bannerTimerRef.current = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [banners.length]);

  const hotSellingList = featuredData.hotSelling.length > 0
    ? featuredData.hotSelling
    : (featuredData.homepageGrid.length > 0 ? featuredData.homepageGrid.slice(0, 10) : FALLBACK_HOT_SELLING);

  const featuredList = featuredData.featured.length > 0
    ? featuredData.featured
    : (featuredData.homepageGrid.length > 0 ? featuredData.homepageGrid.slice(0, 10) : FALLBACK_FEATURED);

  const homepageGridList = featuredData.homepageGrid.length > 0
    ? featuredData.homepageGrid
    : (featuredData.featured.length > 0 ? featuredData.featured : FALLBACK_FEATURED);

  const topDiscountsList = featuredData.topDiscounts.length > 0
    ? featuredData.topDiscounts
    : FALLBACK_TOP_DISCOUNTS;

  // Category Icon Mapping helper
  const getCategoryIcon = (slugOrName) => {
    const s = (slugOrName || '').toLowerCase();
    if (s.includes('tablet')) return <Pill className="w-5 h-5 text-blue-600" />;
    if (s.includes('capsule')) return <Pill className="w-5 h-5 text-purple-600" />;
    if (s.includes('syrup')) return <Droplets className="w-5 h-5 text-rose-600" />;
    if (s.includes('injection')) return <Syringe className="w-5 h-5 text-emerald-600" />;
    if (s.includes('cream') || s.includes('ointment')) return <Sparkles className="w-5 h-5 text-amber-600" />;
    if (s.includes('fitness') || s.includes('health') || s.includes('energy')) return <Activity className="w-5 h-5 text-cyan-600" />;
    if (s.includes('ayurved')) return <Heart className="w-5 h-5 text-emerald-700" />;
    return <HeartHandshake className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 pt-2">
      {/* 1. HERO PROMOTIONAL BANNER SECTION (DYNAMIC FROM ADMIN) */}
      <section className="max-w-7xl mx-auto px-4">
        {banners.length > 0 ? (
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-900 group aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[380px]">
            {banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent flex items-center p-6 sm:p-10 md:p-14">
                  <div className="max-w-xl space-y-2 sm:space-y-3 text-white">
                    {banner.subtitle && (
                      <span className="inline-block px-3 py-1 bg-[#ff5722] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                      {banner.title}
                    </h2>
                    {banner.link && (
                      <div className="pt-2">
                        <Link
                          to={banner.link.startsWith('/') ? banner.link : `/shop`}
                          className="inline-flex items-center space-x-2 bg-white text-slate-900 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
                        >
                          <span>Explore Products</span>
                          <ChevronRight className="w-4 h-4 text-[#ff5722]" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentBannerIndex ? 'bg-[#ff5722] w-6' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Default Premium Hero Banner */
          <div className="relative overflow-hidden bg-gradient-to-r from-brand-blue-950 via-slate-900 to-brand-blue-900 text-white p-6 sm:p-10 md:p-14 rounded-3xl shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>WHO-GMP Certified Healthcare &amp; Express Logistics</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Authentic Medicines <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5722] via-amber-300 to-yellow-200">
                  Direct from Manufacturer.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Order genuine WHO-GMP certified pharmaceuticals, tablets, syrups, and chronic care medicines with verified batch certificates &amp; instant flat discounts.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/shop"
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 transition-all hover:scale-105"
                >
                  Explore Medicines Catalog →
                </Link>
                {onOpenPrescriptionModal && (
                  <button
                    type="button"
                    onClick={onOpenPrescriptionModal}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Prescription</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. TOP CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#ff5722]" />
              <span>Browse by Dosage Form &amp; Category</span>
            </h2>
            <p className="text-xs text-slate-500">Explore verified formulations categorized for fast dispensing.</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-[#ff5722] hover:text-[#f4511e] flex items-center space-x-1">
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {categories.filter(c => !c.parent_id).slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug || cat.id}`}
              className="bg-white hover:bg-orange-50/50 p-3.5 rounded-2xl border border-slate-100 hover:border-orange-200/80 shadow-xs hover:shadow-md transition-all text-center group flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-white flex items-center justify-center border border-slate-100 shadow-xs group-hover:scale-110 transition-transform">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain" />
                ) : (
                  getCategoryIcon(cat.name)
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block group-hover:text-[#ff5722] transition-colors truncate max-w-[100px]">
                  {cat.name}
                </span>
                {cat.products_count !== undefined && (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {cat.products_count} Products
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 🔥 HOT SELLING & HIGH DEMAND MEDICINES (CONTROLLED BY is_trending IN ADMIN) */}
      {hotSellingList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 p-4 sm:p-6 md:p-8 rounded-3xl border border-orange-200/60 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-black text-white bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-1 rounded-full shadow-sm mb-1.5 sm:mb-2 animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-white text-white" />
                  <span>🔥 HOT SELLING • HIGH DEMAND</span>
                </div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Top Fast-Moving Medicines
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
      )}

      {/* 4. ⭐ FEATURED PHARMACEUTICAL PRODUCTS (CONTROLLED BY is_featured IN ADMIN) */}
      {featuredList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4 sm:mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#ff5722] bg-orange-50 px-2.5 py-1 rounded-full mb-1 sm:mb-2">
                <Star className="w-3.5 h-3.5 fill-[#ff5722]" />
                <span>Featured • High Efficacy Formulations</span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Featured Pharmaceutical Products
              </h2>
            </div>
            <Link to="/shop" className="hidden sm:flex text-xs font-bold text-[#ff5722] hover:text-[#f4511e] items-center space-x-1">
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
      )}

      {/* 5. 🏠 HOMEPAGE GRID SHOWCASE (CONTROLLED BY show_on_homepage IN ADMIN) */}
      {homepageGridList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4 sm:mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-1 sm:mb-2">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified Catalog Selection</span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Medicines On Main Showcase
              </h2>
            </div>
            <Link to="/shop" className="hidden sm:flex text-xs font-bold text-blue-700 hover:text-blue-900 items-center space-x-1">
              <span>Browse Full Shop</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {homepageGridList.slice(0, 10).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. 🏷️ TOP DISCOUNT DEALS (UP TO 30% OFF) */}
      {topDiscountsList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4 sm:mb-8">
            <div>
              <span className="text-[11px] sm:text-xs font-bold text-rose-600 uppercase tracking-widest block mb-0.5 sm:mb-1">
                Save Big On Healthcare
              </span>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Medicines with Flat 20% to 30% Discount
              </h2>
            </div>
            <Link to="/shop?sort=discount" className="hidden sm:flex text-xs font-bold text-rose-600 hover:text-rose-800 items-center space-x-1">
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
      )}

      {/* 7. DYNAMIC CATEGORY SHELVES (Tablets, Capsules, Syrups, Injections, etc.) */}
      {featuredData.categoryShelves && featuredData.categoryShelves.length > 0 && (
        featuredData.categoryShelves.slice(0, 3).map((catShelf) => (
          <section key={catShelf.id} className="max-w-7xl mx-auto px-4">
            <div className="bg-slate-50/80 p-5 sm:p-7 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-100">
                    {getCategoryIcon(catShelf.name)}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-black text-slate-900">
                      {catShelf.name} Range
                    </h3>
                    <p className="text-xs text-slate-500">WHO-GMP standard formulations</p>
                  </div>
                </div>
                <Link
                  to={`/shop?category=${catShelf.slug || catShelf.id}`}
                  className="text-xs font-bold text-[#ff5722] hover:text-[#f4511e] flex items-center space-x-1"
                >
                  <span>View All {catShelf.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {catShelf.products.slice(0, 5).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* 8. QUALITY ASSURANCE & TRUST HEALTHCARE BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-blue-950 via-slate-900 to-brand-blue-900 p-6 sm:p-8 md:p-12 text-white overflow-hidden shadow-xl">
          <div className="max-w-3xl space-y-3 sm:space-y-4 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-orange-400 uppercase tracking-widest">
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
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
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

      {/* 9. PRESCRIPTION DISPATCH BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-brand-blue-800 text-white py-10 md:py-16 rounded-3xl max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        <div className="px-6 sm:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Licensed Healthcare &amp; Express Pharmacy</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Authentic Medicines <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
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
                  className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/25 transition-all hover:scale-105"
                >
                  Explore Medicines Catalog →
                </Link>
                {onOpenPrescriptionModal && (
                  <button
                    type="button"
                    onClick={onOpenPrescriptionModal}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Prescription</span>
                  </button>
                )}
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
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Upload Doctor's Prescription</h5>
                      <p className="text-[11px] text-slate-500">Upload camera photo, PDF or document.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Pharmacist Verification</h5>
                      <p className="text-[11px] text-slate-500">Our pharmacist verifies dosage &amp; calls you.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
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


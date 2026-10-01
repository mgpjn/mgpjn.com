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
  FALLBACK_TOP_DISCOUNTS,
  FALLBACK_BANNERS
} from '../data/fallbackProducts';

export default function HomePage({ onOpenPrescriptionModal }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
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
      {/* 1. HERO PROMOTIONAL BANNER SECTION (DYNAMIC FROM ADMIN & FESTIVE FALLBACK) */}
      {(featuredData.hero_slider_enabled !== false && featuredData.hero_slider_enabled !== '0' && banners.length > 0) && (
        <section className="w-full max-w-7xl px-2.5 sm:px-4 mx-auto overflow-hidden">
          <div className="relative w-full max-w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 bg-slate-950 group h-52 xs:h-60 sm:h-72 md:h-80 lg:h-[380px] xl:h-[420px]">
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
                {/* Festive Ambient Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex items-center py-4 px-8 xs:px-10 sm:px-14 md:px-16 sm:py-8 md:py-12 lg:py-16">
                  <div className="max-w-xl space-y-2 sm:space-y-3.5 text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      {banner.subtitle && (
                        <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white text-[9px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-md">
                          {banner.subtitle}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] sm:text-xs font-bold rounded-full">
                        <span>🪔</span>
                        <span>Festive Special</span>
                      </span>
                    </div>

                    <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight sm:leading-snug drop-shadow-sm">
                      {banner.title}
                    </h2>

                    {/* Festive Promo Coupon Pill */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs sm:text-sm">
                      <span className="text-amber-300 font-bold">Festive Coupon:</span>
                      <code className="bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded text-xs sm:text-sm shadow-xs">
                        {banner.code || 'NAVRATRI9'}
                      </code>
                      <span className="text-white/90 text-[11px] sm:text-xs hidden xs:inline">• Extra 10% Instant Off</span>
                    </div>

                    {banner.link && (
                      <div className="pt-1 sm:pt-2">
                        <Link
                          to={banner.link.startsWith('/') ? banner.link : `/shop`}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                        >
                          <span>Explore Navratri Offers</span>
                          <ChevronRight className="w-4 h-4 text-slate-950" />
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
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        idx === currentBannerIndex ? 'bg-amber-400 w-6 sm:w-8' : 'bg-white/50 w-1.5 sm:w-2'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 1.5 🌸 SHUBH NAVRATRI MAHOTSAV - FESTIVE OFFERS & VRAT ESSENTIALS SHOWCASE */}
      <section className="w-full max-w-7xl px-2.5 sm:px-4 mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-900 via-amber-800 to-orange-800 p-4 sm:p-6 md:p-8 shadow-xl text-white border border-amber-500/30">
          {/* Subtle Decorative Ambient Glows */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-52 h-52 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header with Festive Greetings */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-4 mb-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 p-0.5 shadow-lg flex-shrink-0">
                <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center text-2xl">
                  🪔
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                    🌸 Navratri Mahotsav 2026
                  </span>
                  <span className="text-xs font-semibold text-amber-200">
                    Jai Mata Di • 9 Days of Health Blessings
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight mt-1 text-white">
                  Shubh Navratri Festive Health Offers &amp; Fasting Care
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-400/30 self-start md:self-auto">
              <span className="text-xs text-amber-200 font-bold">Use Coupon:</span>
              <code className="text-xs sm:text-sm font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg shadow-sm">
                NAVRATRI9
              </code>
              <span className="text-[11px] text-white/90 font-medium">Flat 10% Extra Off</span>
            </div>
          </div>

          {/* 4 Festive Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
            <Link
              to="/shop"
              className="bg-black/30 hover:bg-black/45 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 transition-all hover:-translate-y-1 hover:border-amber-400/50 group block"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🌸</div>
              <h4 className="text-xs sm:text-sm font-black text-amber-200">9 Sacred Flash Deals</h4>
              <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-snug">
                Up to 40% OFF across top therapeutic medicines &amp; daily family care.
              </p>
              <span className="inline-flex items-center text-[10px] font-bold text-amber-300 mt-2">
                Explore Deals →
              </span>
            </Link>

            <Link
              to="/shop?category=ayurvedic-herbal"
              className="bg-black/30 hover:bg-black/45 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 transition-all hover:-translate-y-1 hover:border-amber-400/50 group block"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🌿</div>
              <h4 className="text-xs sm:text-sm font-black text-amber-200">Vrat &amp; Fasting Vitality</h4>
              <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-snug">
                Ayurvedic liver tonics, electrolytes, vitamin shots &amp; nutrition tonics.
              </p>
              <span className="inline-flex items-center text-[10px] font-bold text-amber-300 mt-2">
                View Herbal Range →
              </span>
            </Link>

            <div className="bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <div className="text-2xl mb-1.5">🪔</div>
              <h4 className="text-xs sm:text-sm font-black text-amber-200">100% Genuine &amp; Pure</h4>
              <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-snug">
                WHO-GMP certified batches with verified cold-chain and expiration guarantee.
              </p>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-300 mt-2">
                ✓ Quality Guaranteed
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <div className="text-2xl mb-1.5">🚚</div>
              <h4 className="text-xs sm:text-sm font-black text-amber-200">Shubh Priority Dispatch</h4>
              <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-snug">
                Express same-day dispatch and zero handling charges on all festive orders.
              </p>
              <span className="inline-flex items-center text-[10px] font-bold text-amber-300 mt-2">
                ⚡ Express Delivery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 🔥 HOT SELLING & HIGH DEMAND MEDICINES (CONTROLLED BY is_trending IN ADMIN) */}
      {hotSellingList.length > 0 && (
        <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-orange-200/60 shadow-sm space-y-3.5 sm:space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-rose-600 to-amber-600 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm mb-1.5 sm:mb-2 animate-pulse">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-white" />
                  <span>🔥 HOT SELLING • HIGH DEMAND</span>
                </div>
                <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
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

            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4">
              {hotSellingList.slice(0, 10).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. ⭐ FEATURED PHARMACEUTICAL PRODUCTS (CONTROLLED BY is_featured IN ADMIN) */}
      {featuredList.length > 0 && (
        <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
          <div className="flex items-end justify-between mb-3.5 sm:mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-[#ff5722] bg-orange-50 px-2.5 py-0.5 sm:py-1 rounded-full mb-1 sm:mb-2">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#ff5722]" />
                <span>Featured • High Efficacy Formulations</span>
              </div>
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Featured Pharmaceutical Products
              </h2>
            </div>
            <Link to="/shop" className="hidden sm:flex text-xs font-bold text-[#ff5722] hover:text-[#f4511e] items-center space-x-1">
              <span>See All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4">
            {featuredList.slice(0, 10).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 5. 🏠 HOMEPAGE GRID SHOWCASE (CONTROLLED BY show_on_homepage IN ADMIN) */}
      {homepageGridList.length > 0 && (
        <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
          <div className="flex items-end justify-between mb-3.5 sm:mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full mb-1 sm:mb-2">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                <span>Verified Catalog Selection</span>
              </div>
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Medicines On Main Showcase
              </h2>
            </div>
            <Link to="/shop" className="hidden sm:flex text-xs font-bold text-blue-700 hover:text-blue-900 items-center space-x-1">
              <span>Browse Full Shop</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4">
            {homepageGridList.slice(0, 10).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. 🏷️ TOP DISCOUNT DEALS (UP TO 30% OFF) */}
      {topDiscountsList.length > 0 && (
        <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
          <div className="flex items-end justify-between mb-3.5 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-widest block mb-0.5 sm:mb-1">
                Save Big On Healthcare
              </span>
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Medicines with Flat 20% to 30% Discount
              </h2>
            </div>
            <Link to="/shop?sort=discount" className="hidden sm:flex text-xs font-bold text-rose-600 hover:text-rose-800 items-center space-x-1">
              <span>View All Deals</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4">
            {topDiscountsList.slice(0, 10).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 7. DYNAMIC CATEGORY SHELVES (Tablets, Capsules, Syrups, Injections, etc.) */}
      {featuredData.categoryShelves && featuredData.categoryShelves.length > 0 && (
        featuredData.categoryShelves
          .filter((catShelf) => !(featuredData.disabled_shelves || []).includes(catShelf.id) && !(featuredData.disabled_shelves || []).includes(Number(catShelf.id)))
          .map((catShelf) => (
          <section key={catShelf.id} className="max-w-7xl mx-auto px-2.5 sm:px-4">
            <div className="bg-slate-50/80 p-3.5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                  <div className="p-2 sm:p-2.5 bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100">
                    {getCategoryIcon(catShelf.name)}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-xl font-black text-slate-900">
                      {catShelf.name} Range
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">WHO-GMP standard formulations</p>
                  </div>
                </div>
                <Link
                  to={`/shop?category=${catShelf.slug || catShelf.id}`}
                  className="text-xs font-bold text-[#ff5722] hover:text-[#f4511e] flex items-center space-x-1"
                >
                  <span className="hidden xs:inline">View All {catShelf.name}</span>
                  <span className="xs:hidden">All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4">
                {catShelf.products.slice(0, 5).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* 8. QUALITY ASSURANCE & TRUST HEALTHCARE BANNER */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand-blue-950 via-slate-900 to-brand-blue-900 p-4 sm:p-8 md:p-12 text-white overflow-hidden shadow-xl">
          <div className="max-w-3xl space-y-2.5 sm:space-y-4 relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-orange-400 uppercase tracking-widest">
              MediGlaxo Quality &amp; Trust Assurance
            </span>
            <h2 className="text-lg sm:text-2xl md:text-4xl font-black tracking-tight leading-tight">
              100% Genuine Medicines with Certified Cold-Chain Logistics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every medication in our catalog is sourced directly from licensed pharmaceutical manufacturers, inspected by registered pharmacists, and delivered in temperature-controlled packaging to preserve efficacy.
            </p>
            <div className="pt-2 sm:pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                <h4 className="font-bold text-xs">WHO-GMP Sourced</h4>
                <p className="text-[11px] text-slate-300">Certified authentic generic formulas.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                <h4 className="font-bold text-xs">Express Delivery</h4>
                <p className="text-[11px] text-slate-300">Fast doorstep dispatch within 24-48h.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 space-y-1 sm:space-y-1.5">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                <h4 className="font-bold text-xs">Pharmacist Checked</h4>
                <p className="text-[11px] text-slate-300">Every prescription verified before dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRESCRIPTION DISPATCH BANNER */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-brand-blue-800 text-white py-7 sm:py-10 md:py-16 rounded-2xl sm:rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

          <div className="px-4 sm:px-8 md:px-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border border-white/10 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span>Licensed Healthcare &amp; Express Pharmacy</span>
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Authentic Medicines <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
                    Delivered In 24 Hours.
                  </span>
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Order genuine WHO-GMP certified pharmaceuticals, generic formulations, syrups, and chronic care medicines with verified batch certificates &amp; flat discounts.
                </p>

                {/* Action CTAs */}
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
                  <Link
                    to="/shop"
                    className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/25 transition-all hover:scale-105 text-center"
                  >
                    Explore Medicines Catalog →
                  </Link>
                  {onOpenPrescriptionModal && (
                    <button
                      type="button"
                      onClick={onOpenPrescriptionModal}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Upload Prescription</span>
                    </button>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% Genuine</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Free Delivery &gt; ₹500</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pharmacist Verified</span>
                  </span>
                </div>
              </div>

              {/* Right Rx Card */}
              <div className="lg:col-span-5">
                <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 space-y-3.5 sm:space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Order with Prescription</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">Quick 3-step prescription dispatch</p>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-2.5 text-xs">
                    <div className="flex items-start space-x-2.5 sm:space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Upload Doctor's Prescription</h5>
                        <p className="text-[10px] sm:text-[11px] text-slate-500">Upload camera photo, PDF or document.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5 sm:space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Pharmacist Verification</h5>
                        <p className="text-[10px] sm:text-[11px] text-slate-500">Our pharmacist verifies dosage &amp; calls you.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5 sm:space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Express Home Delivery</h5>
                        <p className="text-[10px] sm:text-[11px] text-slate-500">Medicines delivered safely at your address.</p>
                      </div>
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


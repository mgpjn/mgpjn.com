import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, FileText, Phone, User as UserIcon,
  ChevronDown, Menu, X, ShieldCheck, HeartPulse, LogOut,
  Network, LayoutDashboard, Sparkles, Plus, AlertCircle, Users,
  Loader2, Pill, Package, Award, ChevronRight, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getCategories, getSearchSuggestions } from '../services/api';

export default function Navbar({ onOpenPrescriptionModal }) {
  const { user, logout } = useAuth();
  const { totalItemsCount, setIsDrawerOpen } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState(null);

  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navTimerRef = useRef(null);

  const handleMouseEnterCat = (catId) => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setActiveCategoryDropdown(catId);
  };

  const handleMouseEnterMenu = () => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
  };

  const handleMouseLeaveNav = () => {
    navTimerRef.current = setTimeout(() => {
      setActiveCategoryDropdown(null);
    }, 180);
  };

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Debounced live search (executes strictly 350ms AFTER typing stops)
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        getSearchSuggestions(searchTerm.trim())
          .then((res) => {
            setSuggestions(res.data.products || []);
            setShowSuggestions(true);
          })
          .catch(() => setSuggestions([]))
          .finally(() => setIsSearching(false));
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  }, [searchTerm]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (searchRef.current && !searchRef.current.contains(e.target)) &&
        (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target))
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getFormattedComposition = (item) => {
    if (item.salt_composition_details && Array.isArray(item.salt_composition_details) && item.salt_composition_details.length > 0) {
      return item.salt_composition_details
        .map((s) => {
          const name = (s.salt_name || '').replace(/\s+IP$/i, '').trim();
          const str = (s.strength || '').trim();
          return str ? `${name} (${str})` : name;
        })
        .filter(Boolean)
        .join(' + ');
    }
    return item.composition || item.subtitle || '';
  };

  const renderSuggestionsDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[85vh] overflow-y-auto divide-y divide-slate-100">
      {suggestions.length === 0 ? (
        <div className="p-5 text-center text-xs text-slate-400">
          {isSearching ? (
            <div className="flex items-center justify-center space-x-2 text-brand-blue-800 font-semibold py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching medicines &amp; salts...</span>
            </div>
          ) : (
            <span>No medicine found matching "{searchTerm}". Try another brand or generic molecule name.</span>
          )}
        </div>
      ) : (
        suggestions.map((item) => {
          const retailPrice = Number(item.retail_price || item.price || 0);
          const mrp = Number(item.mrp || (retailPrice * 1.35));
          const discount = item.discount_percentage || (mrp > retailPrice ? Math.round(((mrp - retailPrice) / mrp) * 100) : 0);
          const compText = getFormattedComposition(item);

          return (
            <div
              key={item.id}
              onClick={() => {
                setShowSuggestions(false);
                setSearchTerm('');
                navigate(`/product/${item.slug || item.id}`);
              }}
              className="px-4 py-3 sm:px-6 hover:bg-slate-50/90 cursor-pointer flex items-center justify-between gap-4 transition-colors group"
            >
              {/* Left Column: Product Title & Formatted Salt Composition */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-brand-blue-800 transition-colors truncate">
                  {item.name}
                </h4>
                {compText && (
                  <p className="text-xs sm:text-[13px] text-slate-500 font-normal truncate mt-0.5">
                    {compText}
                  </p>
                )}
              </div>

              {/* Right Column: Orange Sale Price, Crossed MRP, Green Discount % */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 text-right">
                <span className="text-sm sm:text-base md:text-lg font-black text-brand-orange-500">
                  ₹{retailPrice.toFixed(2)}
                </span>
                {mrp > retailPrice && (
                  <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through">
                    ₹{mrp.toFixed(2)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {discount}% off
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}

      {suggestions.length > 0 && (
        <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
          <button
            onClick={handleSearchSubmit}
            className="text-xs font-bold text-brand-blue-800 hover:text-brand-blue-900 transition-colors"
          >
            View all results for "{searchTerm}" →
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100">
      {/* 1. Top Pharmaceutical Trust Header */}
      <div className="bg-brand-blue-950 text-white text-xs py-1.5 px-4 hidden md:block border-b border-brand-blue-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1.5 font-semibold text-amber-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>WHO-GMP Certified Products • ISO 9001:2015 Licensed Pharma Portal</span>
            </span>
            <span className="flex items-center space-x-1.5 font-medium text-slate-200">
              <Phone className="w-3.5 h-3.5 text-brand-orange-400" />
              <span>Pharmacist Helpline: <strong className="text-white">+91 9650582703</strong></span>
            </span>
            <span className="flex items-center space-x-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Batch Certificate Verified</span>
            </span>
          </div>

          <div className="flex items-center space-x-5">
            <Link to="/track-order" className="hover:text-brand-orange-400 transition-colors font-medium">
              Track Order
            </Link>
            {!user ? (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="hover:text-brand-orange-400 font-semibold">
                  Sign In
                </Link>
                <span>|</span>
                <Link to="/register" className="text-brand-orange-400 hover:underline font-semibold">
                  Create Partner Account
                </Link>
              </div>
            ) : (
              <span className="text-slate-200">
                Welcome, <strong>{user.name}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-700 hover:text-brand-blue-800 p-1.5 -ml-1 rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Official Brand Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 group py-1">
            <img
              src="/logo.png"
              alt="MediGlaxo Pharma Junction"
              className="h-9 sm:h-11 md:h-12 w-auto max-w-[170px] sm:max-w-[200px] md:max-w-[230px] object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Search Bar with Debounce & Styled Search List */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search medicine brand, active salt molecule (e.g. Aceclofenac, Paracetamol, Cefixime)..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs md:text-sm focus:bg-white focus:border-brand-blue-700 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
              </button>
            </form>

            {/* Suggestions Dropdown Styled like Reference Image */}
            {showSuggestions && renderSuggestionsDropdown()}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 sm:px-3.5 sm:py-2 rounded-xl transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-brand-blue-800" />
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-orange-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-scale">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            {!user ? (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Login</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-brand-blue-50 text-brand-blue-900 hover:bg-brand-blue-100 border border-brand-blue-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-blue-800 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[100px] truncate hidden xs:inline">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-blue-600" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 divide-y divide-slate-100 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                      <div className="mt-1.5 inline-block text-[10px] font-extrabold text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded-full uppercase">
                        {user.role} {user.rank ? `• ${user.rank}` : ''}
                      </div>
                    </div>

                    <div className="py-1">
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue-800 font-semibold"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Master Control Panel</span>
                        </Link>
                      )}

                      {user.role !== 'customer' && (
                        <Link
                          to="/hierarchy"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue-800 font-semibold"
                        >
                          <Users className="w-4 h-4 text-brand-blue-600" />
                          <span>Team Hierarchy Manager</span>
                        </Link>
                      )}

                      <Link
                        to="/mlm"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue-800 font-semibold"
                      >
                        <Network className="w-4 h-4 text-brand-orange-500" />
                        <span>Refer &amp; Earn Portal</span>
                      </Link>

                      <Link
                        to="/my-orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-blue-50"
                      >
                        <ShoppingCart className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/prescriptions"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-blue-50"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>My Prescriptions</span>
                      </Link>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile &amp; Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Mobile Search Bar (< 768px) with Debounce & Styled Search List */}
        <div ref={mobileSearchRef} className="mt-2.5 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search medicine brand or salt molecule..."
              className="w-full pl-9 pr-20 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue-700 focus:outline-none placeholder:text-slate-400 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-orange-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {/* Mobile Suggestions Dropdown */}
          {showSuggestions && renderSuggestionsDropdown()}
        </div>
      </div>

      {/* 4. Category Full-Width Mega Navigation Bar (Desktop) */}
      <nav 
        className="border-t border-slate-100 bg-white hidden md:block relative z-30"
        onMouseLeave={handleMouseLeaveNav}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-1 lg:space-x-1.5 py-1">
            {/* All Medicines Mega Button */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnterCat('all')}
            >
              <Link
                to="/shop"
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg flex items-center space-x-1 whitespace-nowrap transition-all ${
                  activeCategoryDropdown === 'all'
                    ? 'bg-brand-blue-50 text-brand-blue-800 shadow-xs'
                    : 'text-slate-800 hover:text-brand-blue-800 hover:bg-slate-50'
                }`}
              >
                <span>All Medicines</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeCategoryDropdown === 'all' ? 'rotate-180 text-brand-blue-800' : 'text-slate-400'}`} />
              </Link>
            </div>

            {/* Individual Category Hover Links */}
            {categories.map((cat) => {
              const isActive = activeCategoryDropdown === cat.id || activeCategoryDropdown === cat.slug;
              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterCat(cat.id)}
                >
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    onMouseEnter={() => handleMouseEnterCat(cat.id)}
                    className={`px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1 whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-brand-blue-50 text-brand-blue-800 font-bold shadow-xs'
                        : 'text-slate-700 hover:text-brand-blue-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isActive ? 'rotate-180 text-brand-blue-800' : 'text-slate-400'}`} />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center space-x-2 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Genuine Pharmacy</span>
            </span>
          </div>
        </div>

        {/* 🌟 FULL PAGE WIDTH MEGA MENU DROPDOWN */}
        {activeCategoryDropdown && (
          <div
            className="absolute top-full left-0 w-full bg-white border-y border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={handleMouseEnterMenu}
            onMouseLeave={handleMouseLeaveNav}
          >
            <div className="max-w-7xl mx-auto px-4 py-7">
              {activeCategoryDropdown === 'all' ? (
                /* Mega Menu for All Medicines */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                        <Package className="w-4 h-4 text-brand-blue-800" />
                        <span>All Medicine Divisions &amp; Therapeutic Formulations</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Explore our comprehensive portfolio of generic and ethical medicines, syrups, capsules, and health products.
                      </p>
                    </div>
                    <Link
                      to="/shop"
                      onClick={() => setActiveCategoryDropdown(null)}
                      className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <span>Open Full Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {categories.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50/30 transition-all space-y-2 group">
                        <Link
                          to={`/shop?category=${c.slug}`}
                          onClick={() => setActiveCategoryDropdown(null)}
                          className="font-black text-xs text-slate-900 group-hover:text-brand-blue-800 flex items-center justify-between"
                        >
                          <span>{c.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-blue-800 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        {c.children && c.children.length > 0 && (
                          <div className="space-y-1">
                            {c.children.slice(0, 4).map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop?category=${c.slug}&sub_category=${sub.slug}`}
                                onClick={() => setActiveCategoryDropdown(null)}
                                className="block text-[11px] text-slate-500 hover:text-brand-blue-800 truncate"
                              >
                                • {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Mega Menu for Individual Category */
                (() => {
                  const activeCat = categories.find((c) => c.id === activeCategoryDropdown || c.slug === activeCategoryDropdown);
                  if (!activeCat) return null;
                  return (
                    <div className="grid grid-cols-12 gap-8">
                      {/* Sub-categories Column (5 cols) */}
                      <div className="col-span-5 border-r border-slate-100 pr-8 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange-500"></span>
                            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                              {activeCat.name} Sub-Categories
                            </h4>
                          </div>
                          <Link
                            to={`/shop?category=${activeCat.slug}`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="text-xs font-bold text-brand-blue-800 hover:underline flex items-center space-x-0.5"
                          >
                            <span>View All ({activeCat.products_count || 0})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {activeCat.children && activeCat.children.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {activeCat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop?category=${activeCat.slug}&sub_category=${sub.slug}`}
                                onClick={() => setActiveCategoryDropdown(null)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-brand-blue-50 hover:text-brand-blue-800 border border-slate-100 hover:border-brand-blue-200 transition-all flex items-center justify-between group"
                              >
                                <span className="truncate group-hover:translate-x-0.5 transition-transform">{sub.name}</span>
                                {sub.products_count > 0 && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-200/80">
                                    {sub.products_count}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 py-4">
                            All {activeCat.name} medicines are tested and WHO-GMP verified.
                          </div>
                        )}
                      </div>

                      {/* Therapeutic Applications & Dosage Forms (4 cols) */}
                      <div className="col-span-4 border-r border-slate-100 pr-8 space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                            Dosage Forms &amp; Formulations
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <Link
                            to={`/shop?category=${activeCat.slug}&search=film+coated`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all space-y-1 block"
                          >
                            <span className="font-bold text-slate-900 block text-xs">Film Coated &amp; Enteric</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">Enhanced bioavailability &amp; gastric safety</span>
                          </Link>

                          <Link
                            to={`/shop?category=${activeCat.slug}&search=sustained+release`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all space-y-1 block"
                          >
                            <span className="font-bold text-slate-900 block text-xs">Sustained / SR Release</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">Long-acting therapeutic dosage</span>
                          </Link>

                          <Link
                            to={`/shop?category=${activeCat.slug}&search=sugar+free`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all space-y-1 block"
                          >
                            <span className="font-bold text-slate-900 block text-xs">Sugar Free Formulations</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">Diabetic safe &amp; pure API active</span>
                          </Link>

                          <Link
                            to={`/shop?category=${activeCat.slug}&search=pediatric`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all space-y-1 block"
                          >
                            <span className="font-bold text-slate-900 block text-xs">Pediatric &amp; Adult Doses</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">Precise clinical concentrations</span>
                          </Link>
                        </div>
                      </div>

                      {/* Promo & Trust Column (3 cols) */}
                      <div className="col-span-3 bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-slate-900 rounded-3xl p-5 text-white flex flex-col justify-between shadow-lg">
                        <div className="space-y-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="bg-brand-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              WHO-GMP
                            </span>
                            <span className="text-[11px] font-semibold text-slate-200">Certified Quality</span>
                          </div>
                          <h5 className="font-black text-base tracking-tight leading-snug">
                            100% Genuine {activeCat.name}
                          </h5>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Formulated under strict CDSCO quality standards with verified batch test certificates.
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-2">
                          <Link
                            to={`/shop?category=${activeCat.slug}`}
                            onClick={() => setActiveCategoryDropdown(null)}
                            className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
                          >
                            <span>Browse All {activeCat.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <div className="text-[10px] text-slate-400 text-center font-medium">
                            ✓ Cold Chain Dispatched
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 5. Mobile Slide-Over Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm flex justify-start animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-white h-full p-5 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <img src="/logo.png" alt="MediGlaxo" className="h-9 w-auto" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPrescriptionModal();
                }}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Upload Doctor's Rx</span>
              </button>

              <Link
                to="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-slate-100 text-slate-800 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
              >
                <span>Track Live Order</span>
              </Link>
            </div>

            {/* Categories List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medicine Categories</h4>
              <div className="space-y-1">
                <Link
                  to="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-brand-blue-800 bg-brand-blue-50"
                >
                  All Medicines Catalog
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-4 border-t border-slate-100 text-xs space-y-2">
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-600 hover:text-brand-blue-800">
                About Us
              </Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-600 hover:text-brand-blue-800">
                Contact &amp; Helpline
              </Link>
              <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-600 hover:text-brand-blue-800">
                FAQs &amp; Help
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

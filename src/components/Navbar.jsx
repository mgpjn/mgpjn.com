import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, FileText, Phone, User as UserIcon,
  ChevronDown, Menu, X, ShieldCheck, HeartPulse, LogOut,
  Network, LayoutDashboard, Sparkles, Plus, AlertCircle, Users,
  Loader2, Pill, Package, Award
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

      {/* 4. Category Mega Navigation Bar (Desktop) */}
      <nav className="border-t border-slate-100 bg-slate-50/50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            <Link
              to="/shop"
              className="px-3 py-2 text-xs font-extrabold text-slate-800 hover:text-brand-blue-800 rounded-lg hover:bg-slate-100 whitespace-nowrap transition-colors"
            >
              All Medicines
            </Link>

            {categories.slice(0, 7).map((cat) => (
              <div
                key={cat.id}
                className="relative group"
                onMouseEnter={() => setActiveCategoryDropdown(cat.id)}
                onMouseLeave={() => setActiveCategoryDropdown(null)}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-blue-800 rounded-lg hover:bg-slate-100 flex items-center space-x-1 whitespace-nowrap transition-colors"
                >
                  <span>{cat.name}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-blue-800 group-hover:rotate-180 transition-transform" />
                  )}
                </Link>

                {/* Sub-menu Mega Dropdown */}
                {cat.children && cat.children.length > 0 && activeCategoryDropdown === cat.id && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                    <div className="p-2 border-b border-slate-50 font-bold text-[11px] text-slate-400 uppercase">
                      {cat.name} Sub-Categories
                    </div>
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop?category=${cat.slug}&sub_category=${sub.slug}`}
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue-800 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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

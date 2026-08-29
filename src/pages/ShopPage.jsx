import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw, X, ChevronRight } from 'lucide-react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryIcon from '../components/CategoryIcon';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters State
  const selectedCategory = searchParams.get('category') || '';
  const selectedSubCategory = searchParams.get('sub_category') || '';
  const selectedDosageForm = searchParams.get('dosage_form') || '';
  const searchQuery = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'default';

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.data.success) setCategories(res.data.categories);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({
      category: selectedCategory,
      sub_category: selectedSubCategory,
      dosage_form: selectedDosageForm,
      search: searchQuery,
      sort: sort,
      per_page: 24,
    })
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.products.data || []);
          setTotalCount(res.data.products.total || 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSubCategory, selectedDosageForm, searchQuery, sort]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === 'category') {
      newParams.delete('sub_category');
    }
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setIsMobileFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setIsMobileFilterOpen(false);
  };

  const dosageForms = ['Tablets', 'Capsules', 'Syrup', 'Injection', 'Ointment', 'Powder'];

  const filterSidebarContent = (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-brand-blue-800" />
          <span>Filters</span>
        </h3>
        <button onClick={clearAllFilters} className="text-[11px] font-bold text-slate-400 hover:text-rose-500">
          Reset All
        </button>
      </div>

      {/* Categories Filter with Specialized Category Icons */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Categories</h4>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          <div
            onClick={() => handleFilterChange('category', '')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              !selectedCategory ? 'bg-brand-blue-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleFilterChange('category', cat.slug)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                selectedCategory === cat.slug ? 'bg-brand-blue-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CategoryIcon slug={cat.slug} name={cat.name} className="w-4 h-4 opacity-90" />
                <span className="truncate max-w-[150px]">{cat.name}</span>
              </div>
              <span className="text-[10px] opacity-70">({cat.products_count || 10})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dosage Form Filter */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Dosage Formulation</h4>
        <div className="space-y-2">
          {dosageForms.map((form) => (
            <label
              key={form}
              className="flex items-center space-x-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <input
                type="radio"
                name="dosage"
                checked={selectedDosageForm === form}
                onChange={() => handleFilterChange('dosage_form', selectedDosageForm === form ? '' : form)}
                className="rounded text-brand-blue-800 focus:ring-0"
              />
              <span>{form}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
          <span className="truncate">Home</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-slate-800 font-semibold truncate">Medicine Catalog</span>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-brand-blue-800 font-bold uppercase truncate">{selectedCategory}</span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
              {selectedCategory ? `${selectedCategory.replace('-', ' ').toUpperCase()} Medicines` : 'All Medicines & Healthcare Products'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Showing {totalCount} verified items available for order.</p>
          </div>

          {/* Controls: Mobile Filter Button + Sort Selector */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Mobile Filter Trigger Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-blue-800" />
              <span>Filters {(selectedCategory || selectedDosageForm) ? '• Active' : ''}</span>
            </button>

            {/* Sort Selector */}
            <select
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="flex-1 sm:flex-initial bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-blue-600 shadow-sm"
            >
              <option value="default">Sort: Featured</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedCategory || selectedSubCategory || selectedDosageForm || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-brand-blue-50/60 rounded-2xl border border-brand-blue-100">
          <span className="text-xs font-bold text-brand-blue-900">Active Filters:</span>
          {selectedCategory && (
            <span className="inline-flex items-center space-x-1 text-xs bg-white px-2.5 py-1 rounded-lg border text-slate-700 font-medium">
              <span>Category: {selectedCategory.replace(/-/g, ' ')}</span>
              <button onClick={() => handleFilterChange('category', '')} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSubCategory && (
            <span className="inline-flex items-center space-x-1 text-xs bg-white px-2.5 py-1 rounded-lg border text-slate-700 font-medium">
              <span>Sub-Category: {selectedSubCategory.replace(/-/g, ' ')}</span>
              <button onClick={() => handleFilterChange('sub_category', '')} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDosageForm && (
            <span className="inline-flex items-center space-x-1 text-xs bg-white px-2.5 py-1 rounded-lg border text-slate-700 font-medium">
              <span>Form: {selectedDosageForm}</span>
              <button onClick={() => handleFilterChange('dosage_form', '')} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center space-x-1 text-xs bg-white px-2.5 py-1 rounded-lg border text-slate-700 font-medium">
              <span>Search: "{searchQuery}"</span>
              <button onClick={() => handleFilterChange('search', '')} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-600 font-bold hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Shop Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          {filterSidebarContent}
        </aside>

        {/* Mobile Filter Slide-Over Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-slate-900">Filter Medicines</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterSidebarContent}
            </div>
          </div>
        )}

        {/* Products Grid: 2 Columns on Mobile */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 h-64 sm:h-80 animate-pulse border border-slate-100"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center space-y-4 border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-brand-blue-50 text-brand-blue-800 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No medicines found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                We couldn't find any products matching your selected category. Try selecting a different category or resetting filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

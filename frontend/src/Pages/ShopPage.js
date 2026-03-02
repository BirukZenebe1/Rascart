import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import { apiUrl } from '../config';

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    setCurrentPage(parseInt(params.get('page') || '1'));
    setSelectedCategory(params.get('category') || '');
    setSortBy(params.get('sort_by') || 'created_at');
    setSortOrder(params.get('sort_order') || 'desc');
    setSearchQuery(params.get('search') || '');
    
    const min = params.get('min_price') || '';
    const max = params.get('max_price') || '';
    if (min || max) {
      setPriceRange({ min, max });
    }
  }, [location.search]);
  
  // Fetch products based on filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query string
        const params = new URLSearchParams();
        params.append('page', currentPage);
        
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        
        if (priceRange.min) {
          params.append('min_price', priceRange.min);
        }
        
        if (priceRange.max) {
          params.append('max_price', priceRange.max);
        }
        
        params.append('sort_by', sortBy);
        params.append('sort_order', sortOrder);
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        
        // Update URL with new parameters
        navigate(`/shop?${params.toString()}`, { replace: true });
        
        // Fetch products
        const response = await axios.get(apiUrl(`/api/products/list?${params.toString()}`));
        
        setProducts(response.data.products);
        setTotalPages(response.data.total_pages);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchProducts();
  }, [currentPage, selectedCategory, priceRange, sortBy, sortOrder, searchQuery, navigate]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(apiUrl('/api/products/categories'));
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Handle filter changes
  const applyFilters = () => {
    // Reset to first page when filtering
    setCurrentPage(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('created_at');
    setSortOrder('desc');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const activeFilterCount = [
    Boolean(selectedCategory),
    Boolean(priceRange.min),
    Boolean(priceRange.max),
    Boolean(searchQuery),
    sortBy !== 'created_at',
    sortOrder !== 'desc'
  ].filter(Boolean).length;

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);

    if (start > 1) {
      pages.push(1);
    }
    if (start > 2) {
      pages.push('...');
    }
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    if (end < totalPages) {
      pages.push(totalPages);
    }

    return pages;
  };
  
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8">Shop</h1>
          <div className="flex justify-center items-center h-64 bg-white/70 rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8">Shop</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl mb-8">
          <div className="absolute -top-12 -right-14 h-40 w-40 rounded-full bg-cyan-200/50 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-indigo-200/40 blur-2xl" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-semibold text-cyan-700 mb-2">Rascart Curated</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Shop smarter, look sharper</h1>
              <p className="text-slate-600 mt-2">Browse style picks tailored for your vibe and budget.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-slate-900 text-white text-sm px-4 py-2">
                {products.length} results
              </span>
              <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-800 text-sm px-4 py-2">
                {activeFilterCount} active filters
              </span>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-[320px] lg:shrink-0 lg:sticky lg:top-24 h-fit bg-white p-5 rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="bg-slate-900 text-white px-4 py-2 rounded-r-md hover:bg-slate-800 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range</label>
            <div className="space-y-2">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                placeholder="Min"
                className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                placeholder="Max"
                className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          
          {/* Sort By */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
            <div className="space-y-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="created_at">Newest</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={applyFilters}
              className="w-1/2 bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="w-1/2 bg-slate-100 text-slate-700 py-2 rounded-md hover:bg-slate-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="w-full min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 rounded-2xl text-center shadow-lg">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 text-slate-700 mb-4 text-2xl">
                ?
              </div>
              <h3 className="text-xl font-bold text-slate-800">No products found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your filters or search criteria.</p>
              <button
                onClick={resetFilters}
                className="mt-5 bg-cyan-600 text-white px-5 py-2 rounded-md hover:bg-cyan-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product count and current filters */}
              <div className="mb-5 p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-sm">
                <span className="text-slate-600">
                  Showing <span className="font-medium">{products.length}</span> products
                </span>
                {(selectedCategory || priceRange.min || priceRange.max || searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-cyan-700 hover:text-cyan-900 font-semibold"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
              
              {/* Products grid with improved spacing and responsive design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              {/* Enhanced pagination */}
              <div className="flex justify-center mt-10 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                
                {/* Show page numbers */}
                <div className="flex space-x-1">
                  {getVisiblePages().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="w-10 h-10 inline-flex items-center justify-center text-slate-400">
                        ...
                      </span>
                    ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full ${
                        currentPage === page
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                    )
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default ShopPage;

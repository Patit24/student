import React, { useState, useEffect } from 'react';
import { subscribeMarketplaceProducts } from '../db.service';
import { Search, ShoppingBag, Download, Package } from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import './Marketplace.css';
import ProductCard from '../components/ProductCard';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // All, Digital, Physical
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeMarketplaceProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const { currentUser } = useAppContext();

  const filteredProducts = products.filter(p => {
    const matchType = filterType === 'All' || p.type === filterType;
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Restriction: Students cannot see Beauty products
    if (currentUser?.role === 'student' && p.type === 'Beauty') return false;
    
    return matchType && matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="marketplace-container page-animate">
      <div className="marketplace-header">
        <div className="header-content">
          <h1>Student Resource <span>Marketplace</span></h1>
          <p>Discover premium study materials, lab kits, and interactive courses to boost your learning.</p>
        </div>
        
        <div className="marketplace-controls">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for books, courses, kits..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <button 
              className={`filter-btn ${filterType === 'All' ? 'active' : ''}`}
              onClick={() => setFilterType('All')}
            >
              All Formats
            </button>
            <button 
              className={`filter-btn ${filterType === 'Digital' ? 'active' : ''}`}
              onClick={() => setFilterType('Digital')}
            >
              <Download size={16} /> Digital PDFs
            </button>
            <button 
              className={`filter-btn ${filterType === 'Physical' ? 'active' : ''}`}
              onClick={() => setFilterType('Physical')}
            >
              <Package size={16} /> Physical Kits
            </button>
          </div>
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-icon" />
          <h3>No products found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}


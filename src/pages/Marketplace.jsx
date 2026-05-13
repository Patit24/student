import React, { useState, useEffect } from 'react';
import { subscribeMarketplaceProducts } from '../db.service';
import { Search, ShoppingBag, Download, Package, Star } from 'lucide-react';
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
    <div className="marketplace-wrapper page-animate">
      <div className="marketplace-hero">
        <div className="hero-glow"></div>
        <div className="container">
          <div className="hero-text">
            <span className="hero-eyebrow">Premium Resources</span>
            <h1>The Student <span>Asset Store</span></h1>
            <p>Elevate your academic journey with curated tools, courses, and physical lab kits designed for excellence.</p>
          </div>
        </div>
      </div>

      <div className="marketplace-toolbar">
        <div className="container">
          <div className="toolbar-inner">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="Find resources..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-tabs">
              {['All', 'Digital', 'Physical', 'Beauty'].map(type => (
                <button 
                  key={type}
                  className={`tab-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'Digital' && <Download size={14} />}
                  {type === 'Physical' && <Package size={14} />}
                  {type === 'Beauty' && <Star size={14} />}
                  {type === 'All' ? 'Everything' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="category-strip">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-icon" />
          <h3>No products found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}


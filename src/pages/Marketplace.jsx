import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeMarketplaceProducts } from '../db.service';
import { Search, Filter, ShoppingBag, Star, Package, Download } from 'lucide-react';
import './Marketplace.css';

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

  const filteredProducts = products.filter(p => {
    const matchType = filterType === 'All' || p.type === filterType;
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
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

function ProductCard({ product }) {
  const isDigital = product.type === 'Digital';
  const defaultImg = isDigital 
    ? 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400' 
    : 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400';
  
  const imgUrl = (product.images && product.images.length > 0) ? product.images[0] : defaultImg;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={imgUrl} alt={product.title} className="product-image" />
        <div className="product-badge">
          {isDigital ? <><Download size={12}/> Digital</> : <><Package size={12}/> Physical</>}
        </div>
      </div>
      
      <div className="product-content">
        <div className="product-category-tag">{product.category || 'General'}</div>
        <h3 className="product-title">{product.title}</h3>
        <div className="product-rating">
          <Star size={14} className="star-icon filled" />
          <Star size={14} className="star-icon filled" />
          <Star size={14} className="star-icon filled" />
          <Star size={14} className="star-icon filled" />
          <Star size={14} className="star-icon half" />
          <span>(4.8)</span>
        </div>
        
        <div className="product-footer">
          <div className="product-pricing">
            <span className="sale-price">₹{product.salePrice || product.originalPrice}</span>
            {product.salePrice && product.salePrice < product.originalPrice && (
              <span className="original-price">₹{product.originalPrice}</span>
            )}
          </div>
          <Link to={`/product/${product.id}`} className="view-btn">
            Quick View
          </Link>
        </div>
      </div>
    </div>
  );
}

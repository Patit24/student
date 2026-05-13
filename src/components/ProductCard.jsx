import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Package, Download, ShoppingBag, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const isDigital = product.type === 'Digital';
  const isBeauty = product.type === 'Beauty';
  
  const defaultImg = isDigital 
    ? 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400' 
    : isBeauty
    ? 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400'
    : 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400';
  
  const imgUrl = (product.images && product.images.length > 0) ? product.images[0] : defaultImg;
  const productLink = isBeauty ? `/beauty-product/${product.id}` : `/product/${product.id}`;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className="product-card">
      <div className="card-glow"></div>
      <div className="product-image-container">
        <img src={imgUrl} alt={product.title} className="product-card-img" />
        <div className="product-type-badge">
          {isDigital ? <Download size={10}/> : isBeauty ? <Star size={10} fill="currentColor"/> : <Package size={10}/>}
          <span>{product.type}</span>
        </div>
        <div className="product-card-overlay">
          <Link to={productLink} className="quick-view-overlay-btn">
            View Details
          </Link>
        </div>
      </div>
      
      <div className="product-info">
        <div className="product-meta">
          <span className="product-cat">{product.category || 'General'}</span>
          <div className="product-rating-small">
            <Star size={12} fill="#F5C518" stroke="#F5C518" />
            <span>4.8</span>
          </div>
        </div>
        
        <h3 className="product-name" title={product.title}>{product.title}</h3>
        
        <div className="product-price-row">
          <div className="price-tag">
            <span className="current-price">₹{product.salePrice || product.originalPrice}</span>
            {product.salePrice && product.salePrice < product.originalPrice && (
              <span className="old-price">₹{product.originalPrice}</span>
            )}
          </div>
          
          <div className="product-card-actions">
            <button 
              onClick={handleAddToCart} 
              className={`add-to-bag-btn ${isBeauty ? 'secondary-action' : ''}`}
            >
              <ShoppingBag size={14} />
              <span>Add to Bag</span>
            </button>
            <Link 
              to={productLink} 
              className={`buy-now-btn ${isBeauty ? 'primary-action' : ''}`}
            >
              Buy Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

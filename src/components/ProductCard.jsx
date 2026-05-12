import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Package, Download } from 'lucide-react';
import './ProductCard.css';

export default function ProductCard({ product }) {
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

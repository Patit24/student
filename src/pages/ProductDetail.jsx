import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMarketplaceProductById, getMarketplaceProducts } from '../db.service';
import { CheckCircle, Shield, Truck, Zap, ShoppingCart, Star, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCarousel from '../components/ProductCarousel';
import './ProductDetail.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await getMarketplaceProductById(productId);
      if (data) {
        setProduct(data);
        setActiveImage(data.images?.[0] || '');
        
        // Load related products
        const allProducts = await getMarketplaceProducts();
        const filtered = allProducts
          .filter(p => p.id !== productId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 8);
        setRelatedProducts(filtered);
      }
      setLoading(false);
    }
    loadData();
    window.scrollTo(0, 0);
  }, [productId]);

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-not-found">
        <h2>Product not found</h2>
        <Link to="/marketplace" className="back-link">Return to Shop</Link>
      </div>
    );
  }

  const isDigital = product.type === 'Digital';

  const handleBuyNow = () => {
    if (!currentUser) {
      navigate('/login', { state: { redirectTo: '/checkout', product } });
      return;
    }
    navigate('/checkout', { state: { product } });
  };

  const handleAddToBag = () => {
    addToCart(product);
  };

  return (
    <div className="pdp-container page-animate">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/marketplace">Marketplace</Link> <span className="separator">/</span> 
        <span className="current">{product.title}</span>
      </div>

      <div className="pdp-main">
        {/* Left: Image Gallery */}
        <div className="pdp-gallery">
          <div className="main-image-container">
            {activeImage ? (
              <img src={activeImage} alt={product.title} className="main-image" />
            ) : (
              <div className="no-image-placeholder">No Image Available</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="pdp-info">
          <div className="product-type-badge">
            {isDigital ? <Zap size={14} /> : <Truck size={14} />}
            {product.type} Product
          </div>
          
          <h1 className="pdp-title">{product.title}</h1>
          
          <div className="pdp-rating">
            <div className="stars">
              <Star size={16} className="star-icon filled" />
              <Star size={16} className="star-icon filled" />
              <Star size={16} className="star-icon filled" />
              <Star size={16} className="star-icon filled" />
              <Star size={16} className="star-icon half" />
            </div>
            <span className="review-count">128 Reviews</span>
          </div>

          <div className="pdp-pricing">
            <span className="pdp-sale-price">₹{product.salePrice || product.originalPrice}</span>
            {product.salePrice && product.salePrice < product.originalPrice && (
              <span className="pdp-original-price">₹{product.originalPrice}</span>
            )}
            {product.salePrice && product.salePrice < product.originalPrice && (
              <span className="pdp-discount-badge">
                Save {Math.round((1 - product.salePrice / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          <div className="pdp-description" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description provided.</p>' }} />

          <div className="pdp-metadata">
            {isDigital ? (
              <>
                <div className="meta-item"><CheckCircle size={16} /> Instant Access via Dashboard</div>
                <div className="meta-item"><CheckCircle size={16} /> Lifetime Updates</div>
                <div className="meta-item"><CheckCircle size={16} /> Format: {product.metadata?.format || 'PDF/Video'}</div>
              </>
            ) : (
              <>
                <div className="meta-item"><Truck size={16} /> Standard Delivery in 3-5 days</div>
                <div className="meta-item"><Shield size={16} /> 7-Day Replacement Policy</div>
                <div className="meta-item"><CheckCircle size={16} /> In Stock: {product.metadata?.stock || 'Available'}</div>
              </>
            )}
          </div>

          <div className="pdp-action-area">
            <button className="add-to-bag-pdp-btn" onClick={handleAddToBag}>
              <ShoppingBag size={20} /> Add to Bag
            </button>
            <button className="buy-now-pdp-btn" onClick={handleBuyNow}>
              <Zap size={20} /> Buy Now
            </button>
            <p className="secure-checkout-text"><Shield size={14} /> Secure Checkout</p>
          </div>
        </div>
      </div>
      
      {/* Social Proof Section */}
      <div className="pdp-social-proof">
        <h3>What Students Say</h3>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="reviewer">
              <div className="reviewer-avatar">R</div>
              <div>
                <h4>Rahul Sharma</h4>
                <div className="verified-badge"><CheckCircle size={12}/> Verified Purchase</div>
              </div>
            </div>
            <p>"Absolutely essential material. Helped me clear my doubts before the exams. Highly recommended!"</p>
          </div>
          <div className="review-card">
            <div className="reviewer">
              <div className="reviewer-avatar">A</div>
              <div>
                <h4>Anjali Gupta</h4>
                <div className="verified-badge"><CheckCircle size={12}/> Verified Purchase</div>
              </div>
            </div>
            <p>"The content is structured so well. The instant delivery for the digital notes was flawless."</p>
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      <div className="pdp-related">
        <ProductCarousel 
          title="Students Also Bought" 
          subtitle="Explore more premium resources curated for your success."
          products={relatedProducts} 
        />
      </div>
    </div>
  );
}

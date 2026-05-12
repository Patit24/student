import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Star, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Truck, 
  RotateCcw, 
  ShieldCheck,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Award,
  Leaf,
  Zap,
  Sparkles,
  FileText,
  Play
} from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { getMarketplaceProductById, getMarketplaceProducts } from '../db.service';
import './BeautyProductDetail.css';

const BeautyProductDetail = () => {
  const { productId } = useParams();
  const { currentUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role === 'student') {
      navigate('/student');
    }
  }, [currentUser, navigate]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedShade, setSelectedShade] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState('description');
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getMarketplaceProductById(productId);
        setProduct(data);
        
        // Fetch recommendations (same category)
        const allProds = await getMarketplaceProducts();
        setRecommendedProducts(allProds.filter(p => p.type === 'Beauty' && p.id !== productId).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) return <div className="loading-screen" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Premium Beauty...</div>;
  if (!product) return <div className="error-screen" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Product not found</div>;

  const metadata = product.metadata || {};
  const shades = metadata.shades || [];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="beauty-pdp-container">
      {/* Breadcrumbs */}
      <nav className="beauty-breadcrumbs">
        <Link to="/">Home</Link> <ChevronRight size={14} />
        <Link to="/marketplace">Marketplace</Link> <ChevronRight size={14} />
        <span className="current">{product.name}</span>
      </nav>

      <div className="beauty-main-grid">
        {/* Left: Gallery */}
        <div className="beauty-gallery-section">
          <div className="thumbnail-rail">
            {product.images?.map((img, i) => (
              <div 
                key={i} 
                className={`thumb-item ${activeImage === i ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt="" />
              </div>
            ))}
          </div>
          <div className="main-image-viewport">
            <img src={product.images?.[activeImage]} alt={product.name} />
            <button className="wishlist-btn-overlay">
              <Heart size={20} />
            </button>
          </div>
        </div>

        {/* Right: Info */}
        <div className="beauty-info-section">
          <div className="brand-badge">{metadata.brand || 'Premium Beauty'}</div>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-subtitle">{metadata.size}</p>

          <div className="rating-summary-row">
            <div className="stars flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < 4 ? "#000" : "none"} stroke="#000" />
              ))}
            </div>
            <span className="rating-text">4.2 (120 Reviews)</span>
          </div>

          <div className="price-block">
            <span className="current-price">₹{product.price}</span>
            <span className="original-price">₹{Math.round(product.price * 1.2)}</span>
            <span className="discount-tag">20% OFF</span>
          </div>

          <div className="offer-banner">
            <div className="offer-content">
              <p className="offer-title">GET FOR ₹{Math.round(product.price * 0.9)}</p>
              <p className="offer-desc">Use Code: BEAUTY10 | On orders above ₹999</p>
            </div>
          </div>

          {/* Shade Selector */}
          {shades.length > 0 && (
            <div className="shade-selector-container">
              <label className="section-label">Select Shade: <span>{shades[selectedShade]?.name}</span></label>
              <div className="shade-grid">
                {shades.map((shade, i) => (
                  <button 
                    key={i}
                    className={`shade-swatch ${selectedShade === i ? 'active' : ''}`}
                    style={{ backgroundColor: shade.hex }}
                    onClick={() => setSelectedShade(i)}
                    title={shade.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="action-row">
            <div className="qty-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16}/></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}><Plus size={16}/></button>
            </div>
            <button className="add-to-bag-btn">
              <ShoppingBag size={20} /> Add to Bag
            </button>
          </div>

          <div className="trust-badges">
            <div className="trust-item"><Truck size={18}/> <span>Free Shipping</span></div>
            <div className="trust-item"><RotateCcw size={18}/> <span>15 Days Return</span></div>
            <div className="trust-item"><ShieldCheck size={18}/> <span>100% Authentic</span></div>
          </div>

          {/* Highlights */}
          <div className="beauty-highlights">
            <div className="highlight-item">
              <Award size={20} />
              <div>
                <strong>Award Winning</strong>
                <span>Best of Beauty 2025</span>
              </div>
            </div>
            <div className="highlight-item">
              <Leaf size={20} />
              <div>
                <strong>Clean Beauty</strong>
                <span>Vegan & Cruelty Free</span>
              </div>
            </div>
          </div>

          {/* Accordions */}
          <div className="beauty-accordions">
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleSection('super-ingredients')}>
                <div className="flex items-center gap-2"><Zap size={18} /> Super Ingredients</div>
                {expandedSection === 'super-ingredients' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {expandedSection === 'super-ingredients' && (
                <div className="accordion-content">
                  <div className="ingredient-chips">
                    {metadata.superIngredients?.map((ing, i) => (
                      <span key={i} className="ing-chip">{ing}</span>
                    )) || (
                      <>
                        <span className="ing-chip">Hyaluronic Acid</span>
                        <span className="ing-chip">Vitamin E</span>
                        <span className="ing-chip">Jojoba Oil</span>
                      </>
                    )}
                  </div>
                  <p>{metadata.ingredients || "Infused with natural botanical extracts for long-lasting hydration."}</p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleSection('description')}>
                <div className="flex items-center gap-2"><FileText size={18} /> Product Description</div>
                {expandedSection === 'description' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {expandedSection === 'description' && (
                <div className="accordion-content">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleSection('brand-story')}>
                <div className="flex items-center gap-2"><Sparkles size={18} /> About the Brand</div>
                {expandedSection === 'brand-story' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {expandedSection === 'brand-story' && (
                <div className="accordion-content">
                  <p>{metadata.brandStory || `Discover the world of ${metadata.brand || 'Premium Beauty'}, where science meets luxury to create transformative beauty experiences.`}</p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleSection('how-to-use')}>
                <div className="flex items-center gap-2"><Play size={18} /> How to Use</div>
                {expandedSection === 'how-to-use' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {expandedSection === 'how-to-use' && (
                <div className="accordion-content">
                  <p>{metadata.howToUse || "Apply evenly on clean skin. Blend outwards for a natural finish."}</p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleSection('details')}>
                <div className="flex items-center gap-2"><ShieldCheck size={18} /> Product Details</div>
                {expandedSection === 'details' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {expandedSection === 'details' && (
                <div className="accordion-content">
                  <div className="spec-grid">
                    <div className="spec-item">
                      <div className="spec-label">Manufacturer</div>
                      <div className="spec-value">{metadata.manufacturer || "N/A"}</div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Country of Origin</div>
                      <div className="spec-value">{metadata.countryOfOrigin || "India"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendedProducts.length > 0 && (
        <section className="beauty-recommendations">
          <h2 className="section-title">You May Also Like</h2>
          <div className="recommendations-grid">
            {recommendedProducts.map(p => (
              <Link to={`/beauty-product/${p.id}`} key={p.id} className="rec-card">
                <div className="rec-img">
                  <img src={p.images?.[0]} alt={p.name} />
                </div>
                <div className="rec-info">
                  <span className="rec-brand">{p.metadata?.brand}</span>
                  <h4 className="rec-name">{p.name}</h4>
                  <span className="rec-price">₹{p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      <section className="beauty-reviews-section">
        <h2 className="section-title">Ratings & Reviews</h2>
        <div className="reviews-layout">
          <div className="rating-breakdown">
            <div className="big-rating">4.2<span>/5</span></div>
            <div className="stars-row flex gap-1 justify-center mb-2">
              <Star size={18} fill="#000" />
              <Star size={18} fill="#000" />
              <Star size={18} fill="#000" />
              <Star size={18} fill="#000" />
              <Star size={18} />
            </div>
            <p>120 Verified Ratings</p>
          </div>
          <div className="review-photos-grid">
             <div className="review-photo-card" style={{ background: '#eee' }}></div>
             <div className="review-photo-card" style={{ background: '#ddd' }}></div>
             <div className="review-photo-card" style={{ background: '#ccc' }}></div>
             <div className="review-photo-card" style={{ background: '#bbb' }}></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BeautyProductDetail;

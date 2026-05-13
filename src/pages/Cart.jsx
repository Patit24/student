import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import './Cart.css';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart-wrapper">
        <div className="container">
          <div className="empty-cart-card glass-panel">
            <div className="empty-icon-wrap">
              <ShoppingBag size={64} />
            </div>
            <h1>Your Bag is <span>Empty</span></h1>
            <p>Looks like you haven't added anything to your cart yet. Explore our premium resources and beauty collection.</p>
            <Link to="/marketplace" className="btn-primary-glow">
              <ArrowLeft size={18} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <Link to="/marketplace" className="back-link">
            <ArrowLeft size={18} /> Back to Shop
          </Link>
          <h1>Shopping <span>Bag</span> <span className="count-badge">{cartCount}</span></h1>
        </div>

        <div className="cart-content-grid">
          <div className="cart-items-section">
            {cart.map((item) => (
              <div key={item.id} className="cart-item glass-panel">
                <div className="item-img">
                  <img src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'} alt={item.title || item.name} />
                </div>
                <div className="item-details">
                  <div className="item-meta">
                    <span className="item-cat">{item.category || item.brand}</span>
                    <h3 className="item-title">{item.title || item.name}</h3>
                  </div>
                  <div className="item-actions-row">
                    <div className="qty-controls">
                      <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn"><Minus size={14} /></button>
                      <span className="qty-val">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="item-price">
                  <span className="price-label">Price</span>
                  <span className="price-val">₹{Number(item.salePrice || item.originalPrice || item.price) * item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card glass-panel">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-tag">Calculated at checkout</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
              
              <button onClick={() => navigate('/checkout')} className="checkout-btn">
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              <div className="secure-badge">
                <CreditCard size={14} /> Secure Checkout Powered by Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

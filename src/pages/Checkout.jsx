import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { createMarketplaceOrder } from '../db.service';
import { Shield, Lock, CreditCard, Gift, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const { showToast } = useToast();
  
  const product = location.state?.product;
  const isDigital = product?.type === 'Digital';
  const isBundle = product?.title?.toLowerCase().includes('bundle');
  const isTuitionStudent = currentUser?.enrolled_batches?.length > 0 || currentUser?.batch_id;
  
  const basePrice = product?.salePrice || product?.originalPrice || 0;
  const isEligibleForBundleDiscount = isBundle && isTuitionStudent;
  const finalPrice = isEligibleForBundleDiscount ? basePrice * 0.5 : basePrice;
  const bundleDiscountAmount = isEligibleForBundleDiscount ? basePrice * 0.5 : 0;
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <Link to="/marketplace" className="btn btn-primary mt-4">Browse Marketplace</Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const orderData = {
          userId: currentUser?.uid || 'guest',
          items: [{ productId: product.id, title: product.title, type: product.type }],
          totalAmount: finalPrice,
          discountApplied: isEligibleForBundleDiscount ? 'STUDENT_BUNDLE_50' : null,
          status: 'Success',
          customerDetails: formData
        };
        
        await createMarketplaceOrder(orderData);
        showToast('Payment successful! Order confirmed.', 'success');
        setIsProcessing(false);
        // Navigate to success page or dashboard
        navigate(currentUser ? '/student' : '/marketplace');
      } catch (error) {
        showToast('Payment failed. Please try again.', 'error');
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="checkout-container page-animate">
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/> Back</button>
        <h1>Secure Checkout</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          <form onSubmit={handlePayment} className="checkout-form">
            <div className="form-group-section">
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
              </div>
            </div>

            {!isDigital && (
              <div className="form-group-section animate-fade-in">
                <h3>Shipping Address</h3>
                <div className="input-group">
                  <label>Street Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>PIN Code</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group-section payment-section">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <div className="payment-option selected">
                  <CreditCard size={24} />
                  <span>Credit / Debit Card (Stripe)</span>
                </div>
                {/* Add more options like UPI, Razorpay here */}
              </div>
              <button type="submit" className="pay-now-btn" disabled={isProcessing}>
                {isProcessing ? 'Processing Payment...' : `Pay ₹${finalPrice}`}
                <Lock size={16} />
              </button>
              <p className="secure-badge"><Shield size={14}/> 256-bit SSL Encrypted</p>
            </div>
          </form>
        </div>

        <div className="checkout-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-item-card">
              <img src={product.images?.[0] || 'https://via.placeholder.com/60'} alt={product.title} />
              <div className="summary-item-info">
                <h4>{product.title}</h4>
                <span>{product.type} Product</span>
              </div>
            </div>
            
            <div className="coupon-code">
              <Gift size={18} />
              <input type="text" placeholder="Discount Code" />
              <button>Apply</button>
            </div>
            
            <div className="summary-totals">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>₹{product.originalPrice}</span>
              </div>
              {product.salePrice && product.salePrice < product.originalPrice && (
                <div className="totals-row discount">
                  <span>Discount</span>
                  <span>-₹{product.originalPrice - product.salePrice}</span>
                </div>
              )}
              {isEligibleForBundleDiscount && (
                <div className="totals-row discount" style={{ color: '#10B981', fontWeight: 600 }}>
                  <span>Student Bundle Offer (50% OFF)</span>
                  <span>-₹{bundleDiscountAmount}</span>
                </div>
              )}
              {!isDigital && (
                <div className="totals-row">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
              )}
              <div className="totals-row total">
                <span>Total</span>
                <span>₹{finalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

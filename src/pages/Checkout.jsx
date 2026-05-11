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
  const toast = useToast();

  // Robust notification helper to prevent "TypeError: r is not a function"
  const safeToast = (msg, type = "success") => {
    try {
      if (toast && typeof toast[type] === "function") {
        toast[type](msg);
      } else {
        alert(msg);
      }
    } catch (e) {
      alert(msg);
    }
  };

  const getApiUrl = () => {
    if (import.meta.env.VITE_APP_API_URL) return import.meta.env.VITE_APP_API_URL.replace(/\/$/, "");
    if (window.location.hostname === 'localhost') return 'http://localhost:4000';
    return ''; 
  };
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
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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


  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    const res = await loadRazorpayScript();

    if (!res) {
      safeToast('Razorpay SDK failed to load. Are you online?', 'error');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create order on backend
      const response = await fetch(`${getApiUrl()}/api/marketplace/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_inr: finalPrice,
          user_id: currentUser?.uid || 'guest',
          product_id: product.id,
          is_bundle_discount: isEligibleForBundleDiscount
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server connection failed');
      }

      const order = await response.json();

      if (!order.order_id) {
        throw new Error('Could not create Razorpay order');
      }

      // 2. Options for Razorpay
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'Antigravity Tuition OS',
        description: `Purchase: ${product.title}`,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            const orderData = {
              userId: currentUser?.uid || 'guest',
              items: [{ productId: product.id, title: product.title, type: product.type }],
              totalAmount: finalPrice,
              discountApplied: isEligibleForBundleDiscount ? 'STUDENT_BUNDLE_50' : null,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              status: 'Paid',
              paymentMethod: 'Razorpay',
              customerDetails: formData
            };
            
            await createMarketplaceOrder(orderData);
            safeToast('Payment successful! Order confirmed. 🚀', 'success');
            navigate(currentUser ? '/student' : '/marketplace');
          } catch (err) {
            safeToast('Order registration failed. Please contact support.', 'error');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#4F46E5' },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', (response) => {
        safeToast(response.error.description, 'error');
      });
      rzp1.open();
    } catch (error) {
      safeToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCODFlow = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        userId: currentUser.uid,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        productId: product.id,
        productTitle: product.title,
        amount: finalPrice,
        currency: 'INR',
        payment_method: 'COD',
        payment_status: 'Pending',
        status: 'Order Placed',
        created_at: new Date().toISOString()
      };

      await createMarketplaceOrder(orderData);
      
      // Fallback alert if toast fails
      try {
        safeToast('Order placed successfully (Cash on Delivery)!', 'success');
      } catch (e) {
        alert('Order placed successfully (Cash on Delivery)!');
      }
      
      setTimeout(() => {
        navigate(currentUser ? '/student' : '/marketplace');
      }, 1500);
    } catch (error) {
      console.error('COD Error:', error);
      try {
        safeToast('Failed to place COD order.', 'error');
      } catch (e) {
        alert('Failed to place COD order.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      await executeCODFlow();
    }
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
                <div 
                  className={`payment-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <CreditCard size={24} />
                  <div className="payment-opt-info">
                    <span className="pay-title">Online Payment</span>
                    <span className="pay-sub">UPI, Cards, Netbanking (Razorpay)</span>
                  </div>
                </div>
                
                {!isDigital && (
                  <div 
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Gift size={24} />
                    <div className="payment-opt-info">
                      <span className="pay-title">Cash on Delivery</span>
                      <span className="pay-sub">Pay when you receive the product</span>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="pay-now-btn" disabled={isProcessing}>
                {isProcessing ? 'Initializing...' : (paymentMethod === 'razorpay' ? `Pay ₹${finalPrice}` : 'Confirm COD Order')}
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

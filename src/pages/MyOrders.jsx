import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { subscribeUserOrders } from '../db.service';
import { Package, ArrowLeft, Clock, CheckCircle, MessageSquare, Phone } from 'lucide-react';
import './Marketplace.css';

export default function MyOrders() {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const unsub = subscribeUserOrders(currentUser.uid, (data) => {
      setOrders(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, [currentUser, navigate]);

  const formatDate = (val) => {
    if (!val) return 'N/A';
    if (val.toDate) return val.toDate().toLocaleDateString();
    return new Date(val).toLocaleDateString();
  };

  return (
    <div className="marketplace-root">
      <div className="container py-12">
        <header className="mb-10">
          <Link to="/" className="flex items-center gap-2 text-muted mb-4 hover-gold">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1 className="cinematic-title" style={{ fontSize: '2.5rem' }}>My <span className="text-gold">Orders</span></h1>
          <p className="text-muted">Track your marketplace purchases and account history.</p>
        </header>

        <div className="glass-card p-8">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin mb-4">⏳</div>
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <h3>No orders yet</h3>
              <p className="text-muted mb-6">You haven't purchased anything from the marketplace yet.</p>
              <Link to="/marketplace" className="btn btn-primary">Browse Shop</Link>
            </div>
          ) : (
            <div className="flex-col gap-6">
              {orders.map(order => (
                <div key={order.id} className="glass-card p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start mobile-stack gap-4">
                    <div className="flex gap-4">
                      <div className="p-3 glass-card" style={{ background: 'rgba(245,197,24,0.1)' }}>
                        <Package size={24} color="#f5c518" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{order.productTitle}</h4>
                        <p className="text-muted text-xs" style={{ margin: '4px 0' }}>Order ID: {order.id}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-gold font-bold">₹{order.amount}</span>
                          <span className="text-muted text-xs">•</span>
                          <span className="text-muted text-xs">{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end mobile-items-start gap-2">
                      <span className={`badge-${order.payment_status === 'Paid' ? 'active' : 'pending'}`}>
                        {order.payment_status === 'Paid' ? <CheckCircle size={12} className="inline mr-1" /> : <Clock size={12} className="inline mr-1" />}
                        {order.payment_status}
                      </span>
                      <div className="text-xs text-muted mt-1">{order.payment_method}</div>
                    </div>
                  </div>
                  
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '1.5rem 0' }} />
                  
                  <div className="flex justify-between items-center mobile-stack gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} color="#f5c518" /> 
                        <span className="text-muted">Status:</span> 
                        <span className="text-white font-bold">{order.status || 'Order Placed'}</span>
                      </div>
                      {order.expectedDelivery && (
                        <div className="text-xs text-gold flex items-center gap-2">
                          <CheckCircle size={12} /> Expected Delivery: {new Date(order.expectedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <a href="tel:+91XXXXXXXXXX" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                        <Phone size={14} /> Support
                      </a>
                      <button className="hp-btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                        <MessageSquare size={14} /> 24/7 Answer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

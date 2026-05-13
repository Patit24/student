import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppContext } from './AuthContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { currentUser } = useAppContext();
  const [cart, setCart] = useState([]);

  // Load cart on mount and when user changes
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${currentUser?.uid || 'guest'}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [currentUser?.uid]);

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem(`cart_${currentUser?.uid || 'guest'}`, JSON.stringify(cart));
  }, [cart, currentUser?.uid]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = (item.quantity || 1) + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.salePrice || item.originalPrice || item.price) * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartCount, 
      cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
}

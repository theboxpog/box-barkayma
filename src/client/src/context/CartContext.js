import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const prevUserIdRef = useRef(undefined);

  // Load cart from localStorage when user changes
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading) {
      return;
    }

    const currentUserId = user?.id;
    const prevUserId = prevUserIdRef.current;

    // Only reload cart if user ID actually changed
    if (currentUserId !== prevUserId) {
      if (user) {
        // Load cart for specific user
        const cartKey = `cart_${user.id}`;
        const savedCart = localStorage.getItem(cartKey);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);

        // Clean up old non-user-specific cart (migration)
        const oldCart = localStorage.getItem('cart');
        if (oldCart) {
          localStorage.removeItem('cart');
        }
      } else {
        // User logged out - clear cart
        setCartItems([]);
      }

      // Update the ref to track this user ID
      prevUserIdRef.current = currentUserId;
    }
  }, [user, loading]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Don't save while auth is still loading or if cart hasn't been initialized
    if (loading || prevUserIdRef.current === undefined) {
      return;
    }

    if (user) {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }
  }, [cartItems, user, loading]);

  const addToCart = (tool, startDate, endDate, quantity) => {
    const cartItem = {
      id: Date.now(), // Unique cart item ID
      toolId: tool.id,
      toolName: tool.name,
      toolCategory: tool.category,
      pricePerDay: tool.price_per_day,
      imageUrl: tool.image_url,
      startDate,
      endDate,
      quantity,
      days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
      totalPrice: 0
    };

    cartItem.totalPrice = cartItem.days * cartItem.pricePerDay * cartItem.quantity;

    setCartItems([...cartItems, cartItem]);
    return true;
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
  };

  const updateCartItem = (cartItemId, updates) => {
    setCartItems(cartItems.map(item => {
      if (item.id === cartItemId) {
        const updatedItem = { ...item, ...updates };
        if (updates.startDate || updates.endDate) {
          updatedItem.days = Math.ceil(
            (new Date(updatedItem.endDate) - new Date(updatedItem.startDate)) / (1000 * 60 * 60 * 24)
          );
          updatedItem.totalPrice = updatedItem.days * updatedItem.pricePerDay * updatedItem.quantity;
        }
        if (updates.quantity) {
          updatedItem.totalPrice = updatedItem.days * updatedItem.pricePerDay * updatedItem.quantity;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    // Also remove from localStorage for current user
    if (user) {
      const cartKey = `cart_${user.id}`;
      localStorage.removeItem(cartKey);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

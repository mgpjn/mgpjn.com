import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductPricing } from '../utils/pricing';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('mediglaxo_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mediglaxo_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock || 500) }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: Math.min(newQuantity, item.stock || 500) } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Process item prices with Dual Pricing logic (Retail vs Wholesale)
  const processedItems = cartItems.map((item) => {
    const pricing = getProductPricing(item, user);
    const retailRate = pricing.retailPrice;
    const wholesaleRate = pricing.wholesalePrice;
    const minWholesaleQty = item.wholesale_min_qty || 5;

    // Wholesale rate is applied only when this logged-in user has an explicit product rate.
    const isWholesale = pricing.wholesaleAllowed;
    const effectiveUnitPrice = isWholesale ? wholesaleRate : retailRate;
    const itemTotal = effectiveUnitPrice * item.quantity;
    const retailMrp = pricing.retailMrp;
    const wholesaleMrp = pricing.wholesaleMrp || retailMrp;
    const effectiveMrp = isWholesale ? wholesaleMrp : retailMrp;
    const itemDiscount = effectiveMrp > effectiveUnitPrice 
      ? Math.round(((effectiveMrp - effectiveUnitPrice) / effectiveMrp) * 100) 
      : 0;
    const itemSavings = Math.max(0, (effectiveMrp - effectiveUnitPrice) * item.quantity);

    return {
      ...item,
      price: effectiveUnitPrice,
      retailRate,
      wholesaleRate,
      wholesaleMrp,
      minWholesaleQty,
      isWholesale,
      effectiveUnitPrice,
      effectiveMrp,
      itemDiscount,
      itemSavings,
      itemTotal,
      itemMrp: effectiveMrp,
    };
  });

  const totalItemsCount = processedItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = processedItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const totalMrp = processedItems.reduce((acc, item) => acc + item.effectiveMrp * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);
  const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  const finalTotal = subtotal + deliveryCharge;
  const isB2BPartner = processedItems.some((item) => item.isWholesale);

  return (
    <CartContext.Provider
      value={{
        cartItems: processedItems,
        isDrawerOpen,
        setIsDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        totalMrp,
        totalSavings,
        deliveryCharge,
        finalTotal,
        isB2BPartner,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

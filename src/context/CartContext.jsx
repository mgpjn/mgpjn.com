import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
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

  // Check if current logged-in user is a B2B partner (Distributor / Retailer)
  const getUser = () => {
    try {
      const userJson = localStorage.getItem('mediglaxo_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();
  const isB2BPartner = user && ['super_distributor', 'distributor', 'sub_distributor', 'retailer', 'sub_retailer', 'admin', 'super_admin'].includes(user.role);

  // Process item prices with Dual Pricing logic (Retail vs Wholesale)
  const processedItems = cartItems.map((item) => {
    const retailRate = Number(item.retail_price || item.price || 0);
    const wholesaleRate = Number(item.wholesale_price || (retailRate * 0.55));
    const minWholesaleQty = item.wholesale_min_qty || 5;

    // Wholesale rate is applied if user is B2B partner OR ordering >= min wholesale qty
    const isWholesale = isB2BPartner || item.quantity >= minWholesaleQty;
    const effectiveUnitPrice = isWholesale ? wholesaleRate : retailRate;
    const itemTotal = effectiveUnitPrice * item.quantity;
    const itemMrp = Number(item.mrp || (retailRate * 1.35));

    return {
      ...item,
      retailRate,
      wholesaleRate,
      minWholesaleQty,
      isWholesale,
      effectiveUnitPrice,
      itemTotal,
      itemMrp,
    };
  });

  const totalItemsCount = processedItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = processedItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const totalMrp = processedItems.reduce((acc, item) => acc + item.itemMrp * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);
  const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  const finalTotal = subtotal + deliveryCharge;

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

import React, { createContext, useState, useContext, useEffect } from 'react';
 
// Create context

const CartContext = createContext();

const getItemId = (item) => item?._id || item?.id;
const normalizeMaxStock = (item) => {
  const parsed = Number(item?.stock);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
 
export const CartProvider = ({ children }) => {

  // Initialize cart from localStorage or empty array

  const [cartItems, setCartItems] = useState(() => {

    const savedCart = localStorage.getItem('cart');

    return savedCart ? JSON.parse(savedCart) : [];

  });

  // Update localStorage whenever cart changes

  useEffect(() => {

    localStorage.setItem('cart', JSON.stringify(cartItems));

  }, [cartItems]);

  // Add item to cart

  const addToCart = (product, quantity = 1) => {

    setCartItems(prevItems => {
      const productId = getItemId(product);
      if (!productId) return prevItems;

      // Check if item already exists in cart

      const existingItemIndex = prevItems.findIndex(item => getItemId(item) === productId);
      const maxStock = normalizeMaxStock(product);

      if (existingItemIndex !== -1) {

        // Update quantity of existing item

        const updatedItems = [...prevItems];
        const nextQuantity = updatedItems[existingItemIndex].quantity + quantity;
        const safeQuantity = maxStock ? Math.min(nextQuantity, maxStock) : nextQuantity;

        updatedItems[existingItemIndex] = {

          ...updatedItems[existingItemIndex],

          quantity: safeQuantity

        };

        return updatedItems;

      } else {

        // Add new item to cart
        const safeQuantity = maxStock ? Math.min(quantity, maxStock) : quantity;

        return [...prevItems, { ...product, quantity: safeQuantity }];

      }

    });

  };

  // Remove item from cart

  const removeFromCart = (productId) => {

    setCartItems(prevItems => prevItems.filter(item => getItemId(item) !== productId));

  };

  // Update item quantity

  const updateQuantity = (productId, quantity) => {

    if (quantity <= 0) {

      removeFromCart(productId);

      return;

    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (getItemId(item) !== productId) return item;
        const maxStock = normalizeMaxStock(item);
        const safeQuantity = maxStock ? Math.min(quantity, maxStock) : quantity;
        return { ...item, quantity: safeQuantity };
      })
    );

  };

  // Clear cart

  const clearCart = () => {

    setCartItems([]);

  };

  // Calculate total price

  const getTotalPrice = () => {

    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  };

  // Get cart item count

  const getCartCount = () => {

    return cartItems.reduce((count, item) => count + item.quantity, 0);

  };

  return (
<CartContext.Provider value={{

      cartItems,

      addToCart,

      removeFromCart,

      updateQuantity,

      clearCart,

      getTotalPrice,

      getCartCount

    }}>

      {children}
</CartContext.Provider>

  );

};
 
// Custom hook for using cart context

export const useCart = () => useContext(CartContext);
 
export default CartContext;

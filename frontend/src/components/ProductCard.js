import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const cart = useCart();
  const isSeller = localStorage.getItem('userType') === 'seller';
  const productId = product._id || product.id;
  const productLink = productId ? `/product/${productId}` : '/shop';
  const isInCart = !!cart?.cartItems?.some((item) => (item._id || item.id) === productId);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSeller || !productId || isInCart) return;

    if (cart?.addToCart) {
      cart.addToCart(product, 1);
    } else {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = savedCart.findIndex((item) => (item._id || item.id) === productId);
      if (existingItemIndex !== -1) {
        savedCart[existingItemIndex] = {
          ...savedCart[existingItemIndex],
          quantity: (savedCart[existingItemIndex].quantity || 0) + 1
        };
      } else {
        savedCart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(savedCart));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link to={productLink} className="block">
        <img
          src={product.imageUrl || product.image_url || 'https://placehold.co/600x400/e2e8f0/1e40af?text=Product'}
          alt={product.name}
          className="w-full h-52 object-cover rounded-xl"
        />
        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
          <p className="text-cyan-700 font-semibold mt-1">${product.price}</p>
        </div>
      </Link>
      <div className="mt-4">
        {!isSeller && (
          <button
            onClick={handleAddToCart}
            disabled={isInCart}
            className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              isInCart
                ? 'bg-emerald-600 text-white shadow-md cursor-not-allowed opacity-95'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isInCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

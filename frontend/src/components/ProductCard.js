import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLikes } from '../context/LikesContext';

const ProductCard = ({ product }) => {
  const cart = useCart();
  const likes = useLikes();
  const isSeller = localStorage.getItem('userType') === 'seller';
  const productId = product._id || product.id;
  const productLink = productId ? `/product/${productId}` : '/shop';
  const isInCart = !!cart?.cartItems?.some((item) => (item._id || item.id) === productId);
  const likeState = likes?.getLikeState(productId, Number(product.likes_count || 0)) || {
    liked: false,
    count: Number(product.likes_count || 0)
  };
  const liked = Boolean(likeState.liked);
  const likeCount = Number(likeState.count || 0);

  useEffect(() => {
    likes?.seedLikeState(productId, Number(product.likes_count || 0));
  }, [likes, productId, product.likes_count]);

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

  const handleLike = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!productId) return;
    await likes?.toggleLike(productId, Number(product.likes_count || 0));
  };

  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const shareUrl = `${window.location.origin}${productLink}`;
    const sharePayload = { title: product.name, text: `Check out ${product.name} on merkatoAI`, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      // user dismissed share; no action needed
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                isInCart
                  ? 'btn-cart btn-cart-added'
                  : 'btn-cart'
              }`}
            >
              {isInCart ? 'Added to Cart' : 'Add to Cart'}
            </button>
            <button
              onClick={handleLike}
              className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md border text-sm font-semibold transition-colors ${
                liked
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Like"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${liked ? 'scale-110' : 'scale-100'}`}
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L4.22 13.45 12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              title="Share"
            >
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

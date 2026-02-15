import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Add this import at the top
import ProductCard from '../components/ProductCard';
import { apiUrl } from '../config';

function ProductDetailPage() {
  const { id: productId } = useParams();
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const isSeller = localStorage.getItem('userType') === 'seller';
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState(null);
  const [styleMatch, setStyleMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [thread, setThread] = useState(null);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Determine which endpoint to use based on authentication
        const endpoint = token 
          ? `/api/products/${productId}/with-style-match`
          : `/api/products/${productId}`;
        
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(apiUrl(endpoint), { headers });
        
        if (token) {
          setProduct(response.data.product);
          setStyleMatch(response.data.style_match);
        } else {
          setProduct(response.data.product);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load product details');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchProduct();
  }, [productId, token]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product || !product._id) return;

      try {
        setSimilarLoading(true);
        const response = await axios.get(apiUrl('/api/products/list?per_page=48&page=1'));
        const candidates = (response.data.products || []).filter((item) => item._id !== product._id);

        const targetCategories = new Set(product.categories || []);
        const targetType = (product.product_type || '').toLowerCase();
        const targetColor = (product.attributes?.color || '').toLowerCase();
        const targetMaterial = (product.attributes?.material || '').toLowerCase();
        const targetPrice = Number(product.price || 0);

        const scored = candidates.map((item) => {
          let score = 0;
          const categories = item.categories || [];
          const sharedCategories = categories.filter((c) => targetCategories.has(c)).length;
          score += sharedCategories * 3;

          if ((item.product_type || '').toLowerCase() === targetType && targetType) {
            score += 4;
          }
          if ((item.attributes?.color || '').toLowerCase() === targetColor && targetColor) {
            score += 2;
          }
          if ((item.attributes?.material || '').toLowerCase() === targetMaterial && targetMaterial) {
            score += 2;
          }

          const itemPrice = Number(item.price || 0);
          const priceDiff = Math.abs(itemPrice - targetPrice);
          score += Math.max(0, 3 - priceDiff / 25);

          return { ...item, __score: score };
        });

        const topSimilar = scored
          .sort((a, b) => b.__score - a.__score)
          .slice(0, 4);

        setSimilarProducts(topSimilar);
      } catch (err) {
        console.error('Failed to fetch similar products:', err);
        setSimilarProducts([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [product]);

  useEffect(() => {
    const fetchThread = async () => {
      if (!token || !productId) return;
      try {
        const response = await axios.get(apiUrl(`/api/messages/thread/${productId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setThread(response.data.thread);
      } catch (err) {
        console.error('Failed to load chat thread:', err);
      }
    };
    fetchThread();
  }, [productId, token]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    if (cart?.addToCart) {
      cart.addToCart(product, quantity);
    } else {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = savedCart.findIndex((item) => item._id === product._id);
      if (existingItemIndex !== -1) {
        savedCart[existingItemIndex] = {
          ...savedCart[existingItemIndex],
          quantity: (savedCart[existingItemIndex].quantity || 0) + quantity
        };
      } else {
        savedCart.push({ ...product, quantity });
      }
      localStorage.setItem('cart', JSON.stringify(savedCart));
    }
    alert(`Added ${quantity} of ${product.name} to cart`);
  };

  const handleSendMessage = async () => {
    if (!chatText.trim()) return;
    setChatLoading(true);
    try {
      const response = await axios.post(
        apiUrl(`/api/messages/thread/${productId}`),
        { text: chatText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setThread(response.data.thread);
      setChatText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setChatLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error || 'Product not found'}
          </div>
          <button 
            onClick={() => navigate('/shop')}
            className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image */}
        <div className="lg:w-1/2">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <img 
              src={product.imageUrl || product.image_url || `https://placehold.co/600x400/e2e8f0/1e40af?text=${encodeURIComponent(product.name.split(' ')[0])}`}
              alt={product.name}
              className="w-full h-auto object-cover min-h-[360px]"
            />
          </div>
        </div>
        
        {/* Product Details */}
        <div className="lg:w-1/2 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Style Match Indicator (if available) */}
          {styleMatch && styleMatch.has_style_profile && (
            <div className={`mb-4 p-3 rounded-lg ${
              styleMatch.match_score > 75 ? 'bg-emerald-100 text-emerald-800' :
              styleMatch.match_score > 50 ? 'bg-cyan-100 text-cyan-800' :
              styleMatch.match_score > 25 ? 'bg-amber-100 text-amber-800' :
              'bg-slate-100 text-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Style Match</span>
                <span className="font-bold">{styleMatch.match_score}%</span>
              </div>
              {styleMatch.match_reasons.length > 0 && (
                <ul className="mt-2 text-sm">
                  {styleMatch.match_reasons.map((reason, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Product Name and Price */}
          <h1 className="text-3xl font-black text-slate-900">{product.name}</h1>
          <p className="text-2xl font-bold text-cyan-700 mt-2">${Number(product.price).toFixed(2)}</p>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.categories && product.categories.map((category, index) => (
              <span key={index} className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full font-medium">
                {category}
              </span>
            ))}
          </div>
          
          {/* Description */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">Description</h2>
            <p className="mt-2 text-slate-600">{product.description}</p>
          </div>
          
          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Details</h2>
              <ul className="mt-2 space-y-1">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <li key={key} className="flex">
                    <span className="font-medium w-24 capitalize">{key}:</span>
                    <span className="text-slate-600 capitalize">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(product.product_type || product.preferred_contact || product.payment_method) && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Seller Info</h2>
              <ul className="mt-2 space-y-1">
                {product.product_type && (
                  <li className="flex">
                    <span className="font-medium w-32">Type:</span>
                    <span className="text-slate-600">{product.product_type}</span>
                  </li>
                )}
                {product.preferred_contact && (
                  <li className="flex">
                    <span className="font-medium w-32">Contact:</span>
                    <span className="text-slate-600">{product.preferred_contact}</span>
                  </li>
                )}
                {product.payment_method && (
                  <li className="flex">
                    <span className="font-medium w-32">Payment:</span>
                    <span className="text-slate-600">{product.payment_method}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Quantity Selector */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <div className="flex items-center">
              <button 
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="bg-slate-100 border border-slate-300 px-3 py-1 rounded-l-md"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border-t border-b border-slate-300 py-1"
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="bg-slate-100 border border-slate-300 px-3 py-1 rounded-r-md"
              >
                +
              </button>
            </div>
          </div>
          
          {!isSeller && (
            <button
              onClick={handleAddToCart}
              className="mt-6 w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors font-semibold"
            >
              Add to Cart
            </button>
          )}
          
          {/* Back to Shop */}
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 w-full bg-slate-100 text-slate-800 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Back to Shop
          </button>
        </div>
      </div>
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">AI Similar Picks</h2>
            <span className="text-sm text-slate-500">Based on style, type, and price</span>
          </div>

          {similarLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="text-slate-500 mt-3">Analyzing similar products...</p>
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              No similar products found yet.
            </div>
          )}
        </div>
        {token && (
          <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Chat with Seller</h2>
            {isSeller ? (
              <div className="text-slate-600">Sellers can reply from the Seller Chats page.</div>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-4 space-y-3 mb-4">
                  {thread?.messages?.length ? (
                    thread.messages.map((msg, idx) => (
                      <div key={idx} className="text-sm text-slate-700">
                        <span className="font-semibold">
                          {msg.sender_id === localStorage.getItem('userId') ? 'You' : 'Seller'}:
                        </span>{' '}
                        {msg.text}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No messages yet. Start a conversation.</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="Ask about availability, sizing, delivery..."
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md"
                  >
                    {chatLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Add this import at the top

function ProductDetailPage() {
  const { id: productId } = useParams();
  const { token} = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart(); // Add this near other hook calls
  const [product, setProduct] = useState(null);
  const [styleMatch, setStyleMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Determine which endpoint to use based on authentication
        const endpoint = token 
          ? `http://localhost:5001/api/products/${productId}/with-style-match`
          : `http://localhost:5001/api/products/${productId}`;
        
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(endpoint, { headers });
        
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
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`Added ${quantity} of ${product.name} to cart`);
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
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors font-semibold"
          >
            Add to Cart
          </button>
          
          {/* Back to Shop */}
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 w-full bg-slate-100 text-slate-800 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Back to Shop
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;

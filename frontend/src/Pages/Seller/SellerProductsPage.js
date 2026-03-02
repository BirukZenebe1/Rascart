import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useLikes } from '../../context/LikesContext';

function SellerProductsPage() {
  const location = useLocation();
  const likes = useLikes();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const metric = new URLSearchParams(location.search).get('metric') || 'total';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    products.forEach((product) => {
      likes?.seedLikeState(product._id, Number(product.likes_count || 0));
    });
  }, [likes, products]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/seller/products'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const monitoredProducts = React.useMemo(() => {
    const list = [...products];
    if (metric === 'active') {
      return list.filter((product) => product.is_active);
    }
    if (metric === 'views') {
      return list.sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
    }
    if (metric === 'sales') {
      return list.sort((a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0));
    }
    return list;
  }, [products, metric]);

  const availableByType = React.useMemo(() => {
    return products.reduce((acc, product) => {
      const key = (product.product_type || '').trim().toLowerCase();
      if (!key) return acc;
      const inStockActive = Boolean(product.is_active) && Number(product.stock || 0) > 0;
      if (inStockActive) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  }, [products]);

  const monitorLabel = {
    total: 'Monitoring total products',
    active: 'Monitoring active products',
    views: 'Monitoring product views',
    sales: 'Monitoring product sales'
  }[metric] || 'Monitoring total products';

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(apiUrl(`/api/seller/products/${productId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from state
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const toggleActive = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        apiUrl(`/api/seller/products/${productId}`),
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update state
      setProducts(products.map(p => 
        p._id === productId ? { ...p, is_active: !currentStatus } : p
      ));
    } catch (err) {
      alert('Failed to update product status');
    }
  };

  const handleLike = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    await likes?.toggleLike(product._id, Number(product.likes_count || 0));
  };

  const handleShare = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    const productLink = `/product/${product._id}`;
    const shareUrl = `${window.location.origin}${productLink}`;
    const payload = {
      title: product.name,
      text: `Check out ${product.name} on Rascart`,
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      // dismissed
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[420px]">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[420px]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link
          to="/seller/products/add"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add New Product
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
        {monitorLabel}
      </div>

      {monitoredProducts.length === 0 ? (
        <div className="bg-gray-100 p-12 rounded-lg text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first product</p>
          <Link
            to="/seller/products/add"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-[1150px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Same Type In Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monitoredProducts.map((product) => {
                const likeState = likes?.getLikeState(product._id, Number(product.likes_count || 0)) || {
                  liked: false,
                  count: Number(product.likes_count || 0)
                };
                const liked = Boolean(likeState.liked);
                const likeCount = Number(likeState.count || 0);
                return (
                  <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.categories.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.product_type || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.product_type
                        ? availableByType[(product.product_type || '').trim().toLowerCase()] || 0
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.preferred_contact || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.payment_method || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(product._id, product.is_active)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        Number(product.stock || 0) <= 0
                          ? 'bg-rose-100 text-rose-800'
                          : product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {Number(product.stock || 0) <= 0 ? 'Sold Out' : product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.views || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sales_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <button
                      onClick={(event) => handleLike(event, product)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        liked
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${liked ? 'scale-110' : 'scale-100'}`}
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
                      {likeCount}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(event) => handleShare(event, product)}
                      className="text-slate-700 hover:text-slate-900 mr-4"
                    >
                      Share
                    </button>
                    <Link
                      to={`/seller/products/edit/${product._id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SellerProductsPage;

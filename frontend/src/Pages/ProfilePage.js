import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(apiUrl('/api/orders/my'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };
    fetchOrders();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: '/profile', message: 'Please login first to continue.' } });
        return;
      }
      const response = await axios.get(apiUrl('/api/auth/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login', { state: { from: '/profile', message: 'Please login first to continue.' } });
        return;
      }
      setError('Failed to fetch profile');
      setLoading(false);
    }
  };

  const handlePhotoUpdate = (newPhotoPath) => {
    setUser({ ...user, profile_photo: newPhotoPath });
  };

  const handleFieldChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setSaveMessage('');
      const token = localStorage.getItem('token');
      const payload = {
        username: user.username,
        preferred_payment_method: user.preferred_payment_method || ''
      };

      const response = await axios.put(apiUrl('/api/auth/profile'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.user);
      localStorage.setItem('username', response.data.user.username || '');
      setEditing(false);
      setSaveMessage('Profile saved successfully.');
    } catch (err) {
      setSaveMessage(err.response?.data?.error || 'Failed to save profile changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) {
      return;
    }
    localStorage.clear();
    navigate('/login');
  };

  const isPersonalized =
    user?.is_personalized ||
    user?.personalization_state === 'personalized' ||
    Boolean(user?.style_profile);
  const getOrderItemImage = (item) =>
    item?.imageUrl ||
    item?.image_url ||
    'https://placehold.co/64x64/e2e8f0/1e293b?text=Item';

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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error || 'User not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-black text-slate-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            {/* Profile Photo Upload */}
            <ProfilePhotoUpload
              currentPhoto={user.profile_photo}
              onPhotoUpdate={handlePhotoUpdate}
            />
            
            <h2 className="text-2xl font-bold mb-1 mt-4 text-slate-900">{user.username}</h2>
            <p className="text-slate-500 mb-4">{user.email}</p>
            
            <div className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm mb-4 font-semibold">
              {user.user_type === 'seller' ? 'Seller Account' : 'Customer Account'}
            </div>
            {user.user_type !== 'seller' && (
              <div className={`inline-block ml-2 px-3 py-1 rounded-full text-sm mb-4 font-semibold ${isPersonalized ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {isPersonalized ? 'Personalized' : 'Default'}
              </div>
            )}
            
            <div className="text-sm text-slate-500">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Account Information</h3>
              <button
                onClick={() => setEditing(!editing)}
                className="text-cyan-700 hover:text-cyan-900 font-semibold"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={user.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500">Email is locked after registration.</p>
              </div>

              {user.user_type !== 'seller' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Payment Method</label>
                  <select
                    value={user.preferred_payment_method || ''}
                    onChange={(e) => handleFieldChange('preferred_payment_method', e.target.value)}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md disabled:bg-slate-100"
                  >
                    <option value="">Select preferred method</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                  </select>
                  {user.preferred_payment_method && (
                    <div className="mt-2 text-sm text-emerald-700">Payment method verified</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <input
                  type="text"
                  value={user.user_type === 'seller' ? 'Seller' : 'Customer'}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100"
                />
              </div>

              {editing && (
                <button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              {saveMessage && (
                <div className={`text-sm mt-2 ${saveMessage.includes('successfully') ? 'text-cyan-700' : 'text-red-600'}`}>
                  {saveMessage}
                </div>
              )}
            </div>
          </div>

          {/* Style Profile Section (for buyers) */}
          {user.user_type !== 'seller' && (
            <div className="relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 shadow-sm p-6 mb-6">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-200/50 blur-2xl" />
              <div className="absolute -bottom-10 -left-8 w-24 h-24 rounded-full bg-indigo-200/40 blur-2xl" />
              <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-cyan-700 mb-2">AI Personalization</p>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Style Profile</h3>
              {isPersonalized ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="text-emerald-700 font-semibold mb-2">Style profile completed</div>
                  <p className="text-sm text-emerald-700/80 mb-3">
                    Your recommendations are now optimized for your taste.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/style-results" className="inline-flex bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                      View My Style Results
                    </Link>
                    <Link to="/style-questionnaire" className="inline-flex bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium">
                      Edit Style Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600 mb-4">
                    Create your style profile to get personalized product recommendations
                  </p>
                  <Link
                    to="/style-questionnaire"
                    className="inline-flex bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors font-semibold"
                  >
                    Create Style Profile
                  </Link>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Orders Section (for buyers) */}
          {user.user_type !== 'seller' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>No orders yet</p>
                  <p className="text-sm mt-1">Start shopping to see your orders here</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <li key={order._id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-900">Order #{String(order._id).slice(-8).toUpperCase()}</span>
                        <span className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-2">
                        {(order.items || []).map((item, index) => (
                          <div key={`${order._id}-${index}`} className="flex items-center gap-3">
                            <img
                              src={getOrderItemImage(item)}
                              alt={item?.name || 'Product'}
                              className="w-10 h-10 rounded-md object-cover border border-slate-200"
                            />
                            <div className="text-sm font-medium text-slate-700 truncate">{item?.name || 'Product'}</div>
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleLogout}
            className="btn-logout text-white px-6 py-3 rounded-md transition-colors font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

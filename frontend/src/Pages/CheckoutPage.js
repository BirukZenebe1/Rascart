import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { apiUrl } from '../config';

function CheckoutPage() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoInfo, setPromoInfo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadPreferredPaymentMethod = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        const response = await axios.get(apiUrl('/api/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const preferred = response.data?.user?.preferred_payment_method;
        if (preferred) {
          setFormData((prev) => ({ ...prev, paymentMethod: preferred }));
        }
      } catch (error) {
        console.error('Could not load preferred payment method:', error);
      }
    };

    loadPreferredPaymentMethod();
  }, []);
  
  // Redirect if cart is empty
  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validatePromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(apiUrl('/api/promos/validate'), { code: promoCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromoInfo(response.data);
    } catch (error) {
      setPromoInfo(null);
      setPromoError(error.response?.data?.error || 'Invalid promo code');
    }
  };

  const getDiscountAmount = () => {
    if (!promoInfo) return 0;
    const subtotal = getTotalPrice();
    if (promoInfo.discount_type === 'percent') {
      return (subtotal * promoInfo.discount_value) / 100;
    }
    return promoInfo.discount_value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!window.confirm('Place this order now?')) {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const discount = getDiscountAmount();
      const total = Math.max(0, getTotalPrice() - discount);

      const response = await axios.post(
        apiUrl('/api/orders'),
        {
          items: cartItems,
          total,
          payment_method: formData.paymentMethod,
          promo_code: promoInfo?.code || null,
          discount,
          customer_email: formData.email
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearCart();
      navigate('/order-success', {
        state: {
          orderId: response.data.order_id,
          itemCount: cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
          total: total.toFixed(2),
          emailNotice: response.data.email_notice || '',
          soldOutTypes: response.data.sold_out_types || []
        }
      });
    } catch (error) {
      console.error('Order failed:', error);
      setSubmitError(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-black mb-6 text-slate-900">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Form */}
        <div className="lg:w-2/3">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4 border-t border-slate-200 pt-6 text-slate-900">Payment Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </div>
            
            {formData.paymentMethod === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                    placeholder="•••• •••• •••• ••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleChange}
                    required
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                  <input
                    type="text"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    required
                    placeholder="•••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                You selected <span className="font-semibold">{formData.paymentMethod.replace('_', ' ')}</span>. You will complete this payment method after placing the order.
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold mb-2 text-slate-900">Promo Code</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Enter code"
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md"
                >
                  Apply
                </button>
              </div>
              {promoInfo && (
                <div className="mt-2 text-emerald-700 text-sm">
                  Applied {promoInfo.code} ({promoInfo.discount_type === 'percent' ? `${promoInfo.discount_value}%` : `$${promoInfo.discount_value}`})
                </div>
              )}
              {promoError && (
                <div className="mt-2 text-red-600 text-sm">{promoError}</div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-500 transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
            {submitError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </form>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
            </div>
            
            <ul className="divide-y divide-slate-200">
              {cartItems.map(item => (
                <li key={item._id} className="p-4 flex justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            
            <div className="p-4 border-t border-slate-200">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                {promoInfo && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promo ({promoInfo.code})</span>
                    <span>- ${getDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-slate-200 pt-3 font-bold flex justify-between">
                  <span>Total</span>
                  <span className="text-cyan-700">
                    ${(Math.max(0, getTotalPrice() - getDiscountAmount())).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default CheckoutPage;

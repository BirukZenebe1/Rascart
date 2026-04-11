import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config';
import SocialAuthButtons from '../components/SocialAuthButtons';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer' // Default to buyer
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  const persistSessionAndNavigate = (payload) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('userId', payload.user_id);
    localStorage.setItem('username', payload.username);
    localStorage.setItem('userType', payload.user_type);
    localStorage.setItem('email', payload.email || '');
    if (payload.profile_photo) {
      localStorage.setItem('profilePhoto', payload.profile_photo);
    }
    if (payload.user_type === 'seller') {
      navigate('/seller/dashboard');
      return;
    }
    navigate('/shop');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/api/auth/register'), {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        user_type: formData.userType,
        terms_accepted: termsAccepted
      });

      if (response.data) {
        setVerificationStep(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(apiUrl('/api/auth/verify-email'), {
        email: formData.email,
        code: verificationCode
      });
      if (response.data) {
        navigate('/login', {
          state: {
            message: 'Email verified. Please login.',
            userType: formData.userType
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div>
          <p className="text-center text-xs uppercase tracking-[0.25em] text-cyan-700 font-bold mb-2">Create Account</p>
          <h2 className="text-center text-3xl font-black text-slate-900">
            Create your account
          </h2>
        </div>

        {!verificationStep ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              I want to:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'buyer' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.userType === 'buyer'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-slate-900">Shop</div>
                  <div className="text-xs text-slate-500">Browse and buy products</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'seller' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.userType === 'seller'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-slate-900">Sell</div>
                  <div className="text-xs text-slate-500">List and manage products</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 tracking-wide">or continue with</span>
            </div>
          </div>

          <SocialAuthButtons
            userType={formData.userType}
            onAuthSuccess={(payload) => persistSessionAndNavigate(payload)}
            onError={(messageText) => setError(messageText)}
          />

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="terms" className="text-sm text-slate-600">
              I agree to the <Link to="/terms" className="text-cyan-700 hover:text-cyan-900 font-semibold">Terms and Conditions</Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-cyan-700 hover:text-cyan-900">
              Sign in
            </Link>
          </p>

          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-3 rounded-md">
              We sent a verification code to {formData.email}.
            </div>
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-semibold text-slate-700">
                Verification Code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;

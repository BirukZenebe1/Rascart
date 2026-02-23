import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config';
import SocialAuthButtons from '../components/SocialAuthButtons';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const message = location.state?.message;
  const redirectPath = location.state?.from || '/shop';
  const defaultUserType = location.state?.userType || 'buyer';

  const persistSessionAndNavigate = (payload, fallbackEmail = '') => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('userId', payload.user_id);
    localStorage.setItem('username', payload.username);
    localStorage.setItem('userType', payload.user_type);
    localStorage.setItem('email', payload.email || fallbackEmail);

    if (payload.profile_photo) {
      localStorage.setItem('profilePhoto', payload.profile_photo);
    }

    if (payload.user_type === 'seller') {
      navigate('/seller/dashboard');
      return;
    }
    navigate(redirectPath);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        email,
        password
      });

      if (response.data.token) {
        persistSessionAndNavigate(response.data, email);
      }
    } catch (err) {
      if (err.response?.data?.verification_required) {
        setError('Email not verified. Please check your inbox for the verification code.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div>
          <p className="text-center text-xs uppercase tracking-[0.25em] text-cyan-700 font-bold mb-2">Welcome Back</p>
          <h2 className="text-center text-3xl font-black text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-cyan-700 hover:text-cyan-900">
              Register here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-cyan-700 font-semibold hover:text-cyan-900">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 tracking-wide">or continue with</span>
            </div>
          </div>

          <SocialAuthButtons
            userType={defaultUserType}
            onAuthSuccess={(payload) => persistSessionAndNavigate(payload, '')}
            onError={(messageText) => setError(messageText)}
          />
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

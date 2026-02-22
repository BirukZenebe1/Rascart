import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import basketLogo from '../assets/gebeya-basket-logo.svg';
import { apiUrl } from '../config';

function Navbar() {
  const location = useLocation();
  
  const [state, setState] = useState({
    isLoggedIn: false,
    username: '',
    userType: '',
    unreadChats: 0
  });
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
  const isAdmin = adminEmail && localStorage.getItem('email')?.toLowerCase() === adminEmail.toLowerCase();

  useEffect(() => {
    const syncState = async () => {
      const token = localStorage.getItem('token');
      const nextState = {
        isLoggedIn: !!token,
        username: localStorage.getItem('username') || '',
        userType: localStorage.getItem('userType') || 'buyer',
        unreadChats: 0
      };

      if (token && nextState.userType === 'seller') {
        try {
          const response = await axios.get(apiUrl('/api/messages/threads'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const threads = response.data.threads || [];
          nextState.unreadChats = threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);
        } catch (error) {
          nextState.unreadChats = 0;
        }
      }

      setState(nextState);
    };

    syncState();
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex flex-wrap gap-3 justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
          <img src={basketLogo} alt="merkatoAI logo" className="h-8 w-8" />
          <span>merkato<span className="text-cyan-600">AI</span></span>
        </Link>
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
          {state.isLoggedIn ? (
            <>
              {state.userType === 'seller' ? (
                <>
                  <Link to="/seller/dashboard" className="text-slate-700 hover:text-cyan-700 font-medium">Dashboard</Link>
                  <Link to="/seller/products" className="text-slate-700 hover:text-cyan-700 font-medium">My Products</Link>
                  <Link to="/seller/products/add" className="text-slate-700 hover:text-cyan-700 font-medium">Add Product</Link>
                  <Link to="/seller/profile" className="text-slate-700 hover:text-cyan-700 font-medium">Profile</Link>
                  <Link to="/seller/chats" className="relative text-slate-700 hover:text-cyan-700 font-medium">
                    Chats
                    {state.unreadChats > 0 && (
                      <span className="ml-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {state.unreadChats}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/shop" className="text-slate-700 hover:text-cyan-700 font-medium">Shop</Link>
                  <Link to="/cart" className="text-slate-700 hover:text-cyan-700 font-medium">Cart</Link>
                  <Link to="/profile" className="text-slate-700 hover:text-cyan-700 font-medium">Profile</Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin/promos" className="text-slate-700 hover:text-cyan-700 font-medium">Promos</Link>
              )}
              <span className="text-sm text-slate-700">Welcome, <b>{state.username}</b></span>
              <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full font-semibold">{state.userType === 'seller' ? 'Seller' : 'Customer'}</span>
            </>
          ) : (
            <>
              <Link
                to="/login"
                state={{ from: '/shop', message: 'Please login first to continue.' }}
                className="text-slate-700 hover:text-cyan-700 font-medium"
              >
                Shop
              </Link>
              <Link to="/about" className="text-slate-700 hover:text-cyan-700 font-medium">About</Link>
              <Link to="/login" className="text-slate-700 hover:text-cyan-700 font-medium">Login</Link>
              <Link to="/register" className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

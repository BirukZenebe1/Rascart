import React from 'react';
import { Link } from 'react-router-dom';
import basketLogo from '../assets/gebeya-basket-logo.svg';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <img src={basketLogo} alt="merkatoAI logo" className="h-8 w-8" />
              <h3 className="text-2xl font-black text-white">merkato<span className="text-cyan-400">AI</span></h3>
            </div>
            <p className="text-slate-400 mt-3 text-sm leading-6">
              AI-powered e-commerce platform for personalized shopping, trusted sellers, and seamless checkout.
            </p>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-cyan-300">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-cyan-300">Cart</Link></li>
              <li><Link to="/profile" className="hover:text-cyan-300">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-cyan-300">About</Link></li>
              <li><Link to="/" className="hover:text-cyan-300">How It Works</Link></li>
              <li><a href="mailto:support@gebeyaai.com" className="hover:text-cyan-300">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>24/7 Customer Help</li>
              <li>Safe Payments</li>
              <li>Easy Returns</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-400 flex flex-col md:flex-row md:justify-between gap-2">
          <p>© {year} merkatoAI. All rights reserved.</p>
          <p>Built for modern e-commerce experiences.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

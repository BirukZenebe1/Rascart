import React from 'react';
import { Link } from 'react-router-dom';

function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg p-10">
          <svg className="mx-auto h-24 w-24 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          
          <h1 className="mt-4 text-3xl font-black text-slate-900">Order Successful!</h1>
          <p className="mt-2 text-lg text-slate-600">Thank you for your purchase.</p>
          <p className="text-slate-500">Your order has been placed and will be processed soon.</p>
          
          <div className="mt-8 flex justify-center space-x-4">
            <Link 
              to="/"
              className="px-5 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go to Home
            </Link>
            <Link 
              to="/shop"
              className="px-5 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;

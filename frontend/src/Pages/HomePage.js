import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto p-4 py-10">
        <section className="relative overflow-hidden text-center rounded-3xl bg-white border border-slate-200 shadow-xl p-8 md:p-12">
          <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-cyan-200/50 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-indigo-200/40 blur-2xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 font-bold mb-3">GebeyaAI Shopping</p>
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900">Welcome to GebeyaAI</h1>
            <p className="text-lg md:text-xl mb-8 text-slate-600">Discover products tailored to your unique style</p>
            <Link to="/shop" className="inline-flex bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors font-semibold">
              Explore Shop
            </Link>
          </div>
        </section>

        <section className="my-12">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">1. Create Your Profile</h3>
              <p className="text-slate-600">Answer a few questions about your style preferences</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">2. Get Recommendations</h3>
              <p className="text-slate-600">Our AI analyzes your preferences to find perfect matches</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">3. Shop with Confidence</h3>
              <p className="text-slate-600">Enjoy a personalized shopping experience</p>
            </div>
          </div>
        </section>

        <section className="my-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900">Real User Samples</h2>
            <Link to="/shop" className="text-cyan-700 hover:text-cyan-900 font-semibold">See all products</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-slate-500">Sample User</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Maya K.</h3>
              <p className="text-slate-600 mt-2">Street-casual picks: oversized denim, neutral sneakers, layered basics.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-slate-500">Sample User</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Daniel R.</h3>
              <p className="text-slate-600 mt-2">Smart office set: tapered chinos, clean polos, lightweight jacket.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-slate-500">Sample User</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Hanna T.</h3>
              <p className="text-slate-600 mt-2">Weekend edit: relaxed dresses, crossbody bags, minimalist accessories.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;

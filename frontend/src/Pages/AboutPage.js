import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 font-bold mb-3">About Gebeya AI</p>
          <h1 className="text-4xl font-black text-slate-900 mb-4">E-commerce powered by personalization</h1>
          <p className="text-slate-600 leading-7 mb-4">
            Gebeya AI combines AI-driven product discovery with a clean shopping experience to help customers find
            the right products faster and help sellers reach the right buyers.
          </p>
          <p className="text-slate-600 leading-7">
            We focus on trusted catalogs, useful recommendations, and a smooth checkout flow so shopping feels easy
            from discovery to delivery.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;

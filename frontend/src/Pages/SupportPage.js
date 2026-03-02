import React from 'react';

function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-black text-slate-900 mb-4">Support</h1>
          <p className="text-slate-600 mb-6">Need help? We respond within 24 hours.</p>

          <div className="space-y-4 text-slate-700">
            <p>Email: support@rascart.com</p>
            <p>WhatsApp: +251-900-000-000</p>
            <p>Business Hours: 9am–6pm (EAT)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;

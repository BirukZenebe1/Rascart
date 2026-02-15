import React from 'react';

function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-black text-slate-900 mb-4">Terms and Conditions</h1>
          <p className="text-slate-600 mb-6">Last updated: February 15, 2026</p>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              By using merkatoAI, you agree to these terms. If you do not agree, do not use the platform.
            </p>
            <p>
              Accounts must be registered with accurate information. You are responsible for keeping your
              credentials secure and for all activity under your account.
            </p>
            <p>
              Listings must be accurate, lawful, and reflect the items offered. Sellers are responsible
              for fulfillment, delivery, and customer communication.
            </p>
            <p>
              Purchases are subject to seller availability. Payments are processed according to the method
              selected at checkout. We may update or discontinue features at any time.
            </p>
            <p>
              merkatoAI may suspend or terminate accounts that violate these terms, misuse the service,
              or engage in fraudulent activity.
            </p>
            <p>
              These terms may be updated periodically. Continued use indicates acceptance of changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;

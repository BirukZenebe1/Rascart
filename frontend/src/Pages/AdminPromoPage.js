import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../config';

function AdminPromoPage() {
  const [promos, setPromos] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    expires_at: '',
    usage_limit: ''
  });

  const loadPromos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/promos/admin'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromos(response.data.promos || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load promos');
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(apiUrl('/api/promos/admin'), {
        ...form,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ code: '', discount_type: 'percent', discount_value: '', expires_at: '', usage_limit: '' });
      loadPromos();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create promo');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Promo Codes</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CODE"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
              required
            />
            <input
              type="number"
              placeholder="Discount value"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="percent">Percent</option>
              <option value="amount">Amount</option>
            </select>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Usage limit"
              value={form.usage_limit}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-md">Create Promo</button>
        </form>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          {promos.length === 0 ? (
            <div className="text-slate-500">No promo codes yet.</div>
          ) : (
            <ul className="space-y-3">
              {promos.map((promo) => (
                <li key={promo._id} className="border border-slate-200 rounded-lg p-3">
                  <div className="font-semibold">{promo.code}</div>
                  <div className="text-sm text-slate-600">
                    {promo.discount_type} {promo.discount_value} • Active: {promo.is_active ? 'Yes' : 'No'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPromoPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config';

function SellerChatsPage() {
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(apiUrl('/api/messages/threads'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setThreads(response.data.threads || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load chats');
      }
    };
    fetchThreads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Seller Chats</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          {threads.length === 0 ? (
            <div className="text-slate-500">No chats yet.</div>
          ) : (
            <ul className="space-y-4">
              {threads.map((thread) => (
                <li key={thread._id} className="border border-slate-200 rounded-xl p-4">
                  <div className="text-sm text-slate-500">Product ID: {thread.product_id}</div>
                  <div className="mt-2 text-slate-700">
                    Last message: {thread.messages?.[thread.messages.length - 1]?.text || 'No messages'}
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

export default SellerChatsPage;

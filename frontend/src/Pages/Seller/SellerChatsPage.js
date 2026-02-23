import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config';

function SellerChatsPage() {
  const isSeller = (localStorage.getItem('userType') || 'buyer') === 'seller';
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedThreadIdRef = useRef(null);

  const fetchThreads = async (preserveSelection = true) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/messages/threads'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextThreads = response.data.threads || [];
      setThreads(nextThreads);

      if (!nextThreads.length) {
        setSelectedThread(null);
        return;
      }

      if (preserveSelection && selectedThreadIdRef.current) {
        const refreshed = nextThreads.find((thread) => thread._id === selectedThreadIdRef.current);
        setSelectedThread(refreshed || nextThreads[0]);
      } else if (!selectedThread) {
        setSelectedThread(nextThreads[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const markSelectedAsRead = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        apiUrl(`/api/messages/thread/${threadId}/read`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThreads(true);
    } catch (err) {
      console.error('Failed to mark thread as read:', err);
    }
  };

  useEffect(() => {
    selectedThreadIdRef.current = selectedThread?._id || null;
  }, [selectedThread]);

  useEffect(() => {
    fetchThreads(false);
    const interval = setInterval(() => fetchThreads(true), 12000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedThread?._id && selectedThread.unread_count > 0) {
      markSelectedAsRead(selectedThread._id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?._id]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedThread) return;
    setSending(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        apiUrl(`/api/messages/thread/${selectedThread.product_id}`),
        {
          text: messageText.trim(),
          thread_id: selectedThread._id,
          buyer_id: selectedThread.buyer_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedThread = response.data.thread;
      setSelectedThread(updatedThread);
      setThreads((prev) => {
        const next = prev.map((thread) => (thread._id === updatedThread._id ? updatedThread : thread));
        next.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        return next;
      });
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  const totalUnread = threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black text-slate-900">{isSeller ? 'Seller Chats' : 'Your Chats'}</h1>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
            {totalUnread} unread
          </span>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Conversations</h2>
            {loading ? (
              <div className="text-slate-500 text-sm">Loading chats...</div>
            ) : threads.length === 0 ? (
              <div className="text-slate-500">No chats yet.</div>
            ) : (
              <ul className="space-y-2 max-h-[560px] overflow-auto pr-1">
                {threads.map((thread) => {
                  const isActive = selectedThread?._id === thread._id;
                  const lastMessage = thread.last_message?.text || thread.messages?.[thread.messages.length - 1]?.text || 'No messages';
                  return (
                    <li key={thread._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedThread(thread)}
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-50'
                            : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900 truncate">
                            {thread.product_name || 'Product chat'}
                          </div>
                          {thread.unread_count > 0 && (
                            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {isSeller
                            ? `Buyer: ${thread.buyer_username || 'Unknown'}`
                            : `Seller: ${thread.seller_username || 'Unknown'}`}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 line-clamp-2">{lastMessage}</div>
                        <div className="mt-2 text-xs text-slate-400">{formatTime(thread.updated_at)}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-0 flex flex-col min-h-[560px]">
            {!selectedThread ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a conversation to start replying.
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="font-semibold text-slate-900">{selectedThread.product_name || 'Product chat'}</div>
                  <div className="text-xs text-slate-500">
                    {isSeller
                      ? `Buyer: ${selectedThread.buyer_username || 'Unknown'}`
                      : `Seller: ${selectedThread.seller_username || 'Unknown'}`}
                  </div>
                </div>

                <div className="flex-1 overflow-auto px-5 py-4 space-y-3 bg-slate-50">
                  {(selectedThread.messages || []).length === 0 ? (
                    <div className="text-sm text-slate-500">No messages yet.</div>
                  ) : (
                    (selectedThread.messages || []).map((message, index) => {
                      const isOwnMessage = message.sender_id === (isSeller ? selectedThread.seller_id : selectedThread.buyer_id);
                      return (
                        <div key={`${message.created_at}-${index}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            isOwnMessage
                              ? 'bg-cyan-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}>
                            <div>{message.text}</div>
                            <div className={`mt-1 text-[11px] ${isOwnMessage ? 'text-cyan-100' : 'text-slate-400'}`}>
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !messageText.trim()}
                      className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerChatsPage;

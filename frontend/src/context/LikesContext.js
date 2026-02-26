import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../config';

const LikesContext = createContext();
const STORAGE_KEY = 'productLikes';
const CHANNEL_NAME = 'productLikesSync';

const parseLikes = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

export const LikesProvider = ({ children }) => {
  const [likeMap, setLikeMap] = useState(() => parseLikes(localStorage.getItem(STORAGE_KEY)));
  const channelRef = useRef(null);
  const tabIdRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likeMap));
  }, [likeMap]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event?.data;
      if (!data || data.source === tabIdRef.current) return;
      if (data.type === 'LIKES_SYNC' && data.payload && typeof data.payload === 'object') {
        setLikeMap(data.payload);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setLikeMap(parseLikes(event.newValue));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const broadcast = (nextMap) => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type: 'LIKES_SYNC',
      source: tabIdRef.current,
      payload: nextMap
    });
  };

  const toggleLike = (productId, fallbackCount = 0) => {
    if (!productId) return Promise.resolve();

    let optimisticState = null;
    setLikeMap((prev) => {
      const current = prev[productId] || { liked: false, count: Number(fallbackCount) || 0 };
      const nextLiked = !current.liked;
      const nextCount = Math.max(0, Number(current.count || 0) + (nextLiked ? 1 : -1));
      optimisticState = { liked: nextLiked, count: nextCount };
      const nextMap = {
        ...prev,
        [productId]: optimisticState
      };
      broadcast(nextMap);
      return nextMap;
    });

    const token = localStorage.getItem('token');
    if (!token) return Promise.resolve(optimisticState);

    return axios
      .post(
        apiUrl(`/api/products/${productId}/like`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        const serverLiked = Boolean(response.data?.liked);
        const serverCount = Math.max(0, Number(response.data?.likes_count || fallbackCount || 0));
        setLikeMap((prev) => {
          const nextMap = {
            ...prev,
            [productId]: { liked: serverLiked, count: serverCount }
          };
          broadcast(nextMap);
          return nextMap;
        });
      })
      .catch(() => optimisticState);
  };

  const getLikeState = (productId, fallbackCount = 0) => {
    if (!productId) return { liked: false, count: Number(fallbackCount) || 0 };
    return likeMap[productId] || { liked: false, count: Number(fallbackCount) || 0 };
  };

  const seedLikeState = (productId, fallbackCount = 0) => {
    if (!productId) return;
    setLikeMap((prev) => {
      if (prev[productId]) return prev;
      return {
        ...prev,
        [productId]: { liked: false, count: Number(fallbackCount) || 0 }
      };
    });
  };

  const value = {
    likeMap,
    toggleLike,
    getLikeState,
    seedLikeState
  };

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
};

export const useLikes = () => useContext(LikesContext);

export default LikesContext;

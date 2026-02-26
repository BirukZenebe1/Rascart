import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
    if (!productId) return;
    setLikeMap((prev) => {
      const current = prev[productId] || { liked: false, count: Number(fallbackCount) || 0 };
      const nextLiked = !current.liked;
      const nextCount = Math.max(0, Number(current.count || 0) + (nextLiked ? 1 : -1));
      const nextMap = {
        ...prev,
        [productId]: { liked: nextLiked, count: nextCount }
      };
      broadcast(nextMap);
      return nextMap;
    });
  };

  const getLikeState = (productId, fallbackCount = 0) => {
    if (!productId) return { liked: false, count: Number(fallbackCount) || 0 };
    return likeMap[productId] || { liked: false, count: Number(fallbackCount) || 0 };
  };

  const value = useMemo(
    () => ({
      likeMap,
      toggleLike,
      getLikeState
    }),
    [likeMap]
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
};

export const useLikes = () => useContext(LikesContext);

export default LikesContext;

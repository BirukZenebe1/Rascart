const envApiBase = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
const isNetlifyHost = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
const fallbackApiBase = isNetlifyHost ? 'https://merkato-ai.onrender.com' : '';

export const API_BASE_URL = envApiBase || fallbackApiBase;

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

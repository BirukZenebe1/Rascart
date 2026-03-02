const rawEnvBase =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  '';
const envApiBase = rawEnvBase.replace(/\/$/, '');
const fallbackApiBase = '';

export const API_BASE_URL = envApiBase || fallbackApiBase;

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

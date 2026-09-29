import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    // If opened on a Phone / remote browser (not localhost), never use a localhost VITE_API_URL
    if (!isLocalHost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      // If opened via LAN IP (e.g. 192.168.x.x:5173 on Phone Wi-Fi), point to that LAN IP on port 5000
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
        return `http://${host}:5000/api`;
      }
      // If opened on Vercel (*.vercel.app) or custom HTTPS domain, use same-origin /api serverless endpoint
      return '/api';
    }
  }
  return envUrl || 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Store JWT access token in memory + sessionStorage fallback for mobile browsers (iOS Safari / Android Chrome)
let inMemoryAccessToken =
  typeof window !== 'undefined' ? sessionStorage.getItem('tb_access_token') : null;
let onAuthChangeCallback = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('tb_access_token', token);
    } else {
      sessionStorage.removeItem('tb_access_token');
    }
  }
};

export const getAccessToken = () => inMemoryAccessToken;

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('tb_access_token');
  }
};

export const registerAuthChangeListener = (cb) => {
  onAuthChangeCallback = cb;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends & receives 7-day httpOnly refreshToken cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach in-memory JWT access token
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent token refresh on 401 Unauthorized
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt silent refresh on auth endpoints themselves
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/verify-otp') ||
      originalRequest?.url?.includes('/auth/resend-otp') ||
      originalRequest?.url?.includes('/auth/google') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken, user } = res.data || {};
        if (!accessToken) {
          throw new Error('Session not authenticated');
        }

        setAccessToken(accessToken);
        if (onAuthChangeCallback) {
          onAuthChangeCallback({ accessToken, user });
        }
        isRefreshing = false;
        onTokenRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearAccessToken();
        onTokenRefreshed(null);
        if (onAuthChangeCallback) {
          onAuthChangeCallback({ accessToken: null, user: null });
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

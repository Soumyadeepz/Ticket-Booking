import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  setAccessToken,
  clearAccessToken,
  registerAuthChangeListener,
} from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tb_pending_otp');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const savePendingOtpState = (data) => {
    setPendingOtp(data);
    if (data) {
      sessionStorage.setItem('tb_pending_otp', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('tb_pending_otp');
    }
  };

  // Sync with Axios interceptor silent refresh updates
  useEffect(() => {
    registerAuthChangeListener(({ accessToken, user: refreshedUser }) => {
      setToken(accessToken);
      setUser(refreshedUser);
    });
  }, []);

  // On initial mount, attempt silent refresh via 7d httpOnly cookie
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (mounted && res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          setToken(res.data.accessToken);
          setUser(res.data.user);
        }
      } catch {
        // Not logged in or cookie expired
        if (mounted) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const registerUser = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    const otpData = {
      email: res.data.email,
      purpose: 'REGISTER',
      cooldownSeconds: res.data.cooldownSeconds || 30,
    };
    savePendingOtpState(otpData);
    return res.data;
  }, []);

  const loginUser = useCallback(async (payload) => {
    const res = await api.post('/auth/login', payload);
    const otpData = {
      email: res.data.email,
      purpose: 'LOGIN',
      cooldownSeconds: res.data.cooldownSeconds || 30,
    };
    savePendingOtpState(otpData);
    return res.data;
  }, []);

  const verifyOtpCode = useCallback(async ({ email, otp, purpose }) => {
    const res = await api.post('/auth/verify-otp', { email, otp, purpose });
    const { accessToken, user: verifiedUser } = res.data;
    setAccessToken(accessToken);
    setToken(accessToken);
    setUser(verifiedUser);
    savePendingOtpState(null);
    return res.data;
  }, []);

  const resendOtpCode = useCallback(async ({ email, purpose }) => {
    const res = await api.post('/auth/resend-otp', { email, purpose });
    const otpData = {
      email: res.data.email || email,
      purpose: purpose || 'LOGIN',
      cooldownSeconds: res.data.cooldownSeconds || 30,
    };
    savePendingOtpState(otpData);
    return res.data;
  }, []);

  const googleLogin = useCallback(async (credential, loginMode = 'user') => {
    const res = await api.post('/auth/google', { credential, loginMode });
    if (res.data?.requiresOtp) {
      savePendingOtpState({
        email: res.data.email,
        purpose: res.data.purpose || 'LOGIN',
        cooldownSeconds: res.data.cooldownSeconds || 30,
      });
      return res.data;
    }
    const { accessToken, user: googleUser } = res.data;
    setAccessToken(accessToken);
    setToken(accessToken);
    setUser(googleUser);
    savePendingOtpState(null);
    return res.data;
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setToken(null);
      setUser(null);
      savePendingOtpState(null);
    }
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    const res = await api.patch('/auth/profile', updates);
    setUser(res.data.user);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        pendingOtp,
        registerUser,
        loginUser,
        verifyOtpCode,
        resendOtpCode,
        googleLogin,
        logoutUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      pendingOtp: null,
      registerUser: async () => ({}),
      loginUser: async () => ({}),
      verifyOtpCode: async () => ({}),
      resendOtpCode: async () => ({}),
      googleLogin: async () => ({}),
      logoutUser: async () => {},
      updateUserProfile: async () => ({}),
    };
  }
  return ctx;
};

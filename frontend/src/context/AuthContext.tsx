import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import axios from 'axios';
import type { AuthTokens } from '../types';

interface AuthUser {
  username: string;
  display_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: any }>;
  sendOTP: (data: any) => Promise<{ success: boolean; message?: string; error?: any }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = 'http://localhost:8000/api/';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const saved = localStorage.getItem('tokens');
    return saved ? JSON.parse(saved) : null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (tokens?.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            if (tokens?.refresh) {
              const response = await axios.post(`${API_URL}token/refresh/`, {
                refresh: tokens.refresh,
              });
              const newTokens = { ...tokens, access: response.data.access };
              setTokens(newTokens);
              localStorage.setItem('tokens', JSON.stringify(newTokens));
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return axios(originalRequest);
            }
          } catch {
            logout();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    setLoading(false);

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [tokens]);

  // Fetch display name on login
  useEffect(() => {
    if (tokens?.access && user && !user.display_name) {
      axios
        .get(`${API_URL}profile/`, { headers: { Authorization: `Bearer ${tokens.access}` } })
        .then((res) => {
          const updatedUser = { ...user, display_name: res.data.display_name || user.username };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        })
        .catch(() => {});
    }
  }, [tokens]);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}login/`, { username, password });
      setTokens(response.data);
      localStorage.setItem('tokens', JSON.stringify(response.data));

      const userObj: AuthUser = { username };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const sendOTP = async (signupData: any) => {
    try {
      const response = await axios.post(`${API_URL}register/send-otp/`, signupData);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, error: error.response?.data || 'Failed to send verification code.' };
    }
  };

  const signup = async (signupData: any) => {
    try {
      await axios.post(`${API_URL}register/`, signupData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data || 'Signup failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, signup, sendOTP, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:8000/api/';

export const AuthProvider = ({ children }) => {
    const [tokens, setTokens] = useState(() => {
        const savedTokens = localStorage.getItem('tokens');
        return savedTokens ? JSON.parse(savedTokens) : null;
    });

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(true);

    const logout = () => {
        setTokens(null);
        setUser(null);
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
    };

    useEffect(() => {
        // Set up Axios request interceptor to attach JWT
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                if (tokens?.access) {
                    config.headers.Authorization = `Bearer ${tokens.access}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Set up Axios response interceptor to handle token refresh
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
                    } catch (refreshError) {
                        // Refresh token expired, logout user
                        logout();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        setLoading(false);

        // Eject interceptors on cleanup to prevent duplicates
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [tokens]);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}login/`, { username, password });
            setTokens(response.data);
            localStorage.setItem('tokens', JSON.stringify(response.data));
            
            const userObj = { username };
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Login failed' };
        }
    };

    const sendOTP = async (signupData) => {
        try {
            const response = await axios.post(`${API_URL}register/send-otp/`, signupData);
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Failed to send verification code.' };
        }
    };

    const signup = async (signupData) => {
        try {
            await axios.post(`${API_URL}register/`, signupData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Signup failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, tokens, login, signup, sendOTP, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


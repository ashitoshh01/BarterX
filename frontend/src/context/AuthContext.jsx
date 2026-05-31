import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:8000/api/';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(() => {
        const savedTokens = localStorage.getItem('tokens');
        return savedTokens ? JSON.parse(savedTokens) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tokens) {
            // In a real app, you'd decode the JWT to get user info or call a /me endpoint
            setUser({ username: 'User' }); // Placeholder
        }
        setLoading(false);
    }, [tokens]);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}login/`, { username, password });
            setTokens(response.data);
            localStorage.setItem('tokens', JSON.stringify(response.data));
            setUser({ username });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Login failed' };
        }
    };

    const signup = async (username, email, password) => {
        try {
            await axios.post(`${API_URL}register/`, { username, email, password });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Signup failed' };
        }
    };

    const logout = () => {
        setTokens(null);
        setUser(null);
        localStorage.removeItem('tokens');
    };

    return (
        <AuthContext.Provider value={{ user, tokens, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

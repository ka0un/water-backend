import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'wq_admin_token';
const USER_KEY = 'wq_admin_user';

const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401 → clear auth and reload
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check if authenticated
    const isAuthenticated = !!token && !!user;

    // Verify token on mount
    useEffect(() => {
        if (token && !user) {
            verifyToken();
        }
    }, []);

    const verifyToken = async () => {
        try {
            const { data } = await api.get('/auth/me');
            const u = data.data.user;
            setUser(u);
            localStorage.setItem(USER_KEY, JSON.stringify(u));
        } catch {
            await logout();
        }
    };

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const { token: newToken, user: newUser } = data.data;

            // Check role — registered system roles can access dashboard flows
            if (!['USER', 'MODERATOR', 'ADMIN', 'LAB_STAFF'].includes(newUser.role)) {
                setError('Access denied for this account role.');
                setLoading(false);
                return false;
            }

            setToken(newToken);
            setUser(newUser);
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));
            setLoading(false);
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            setLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (localStorage.getItem(TOKEN_KEY)) {
                await api.post('/auth/logout');
            }
        } catch (err) {
            // Ignore error so we can still clear local state
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = '/login';
        }
    }, []);

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        logout,
        setError,
        api, // expose the configured axios instance
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

// Export the configured axios instance for use outside React
export { api };

export default AuthContext;

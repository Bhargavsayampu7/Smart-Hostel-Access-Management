import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();
            if (token) {
                try {
                    const userData = await authAPI.getCurrentUser();
                    setUser(userData);
                    if (userData?.role) {
                        localStorage.setItem('role', userData.role);
                    }
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    authAPI.logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await authAPI.login(email, password);
        setUser(data.user);
        if (data.user?.role) {
            localStorage.setItem('role', data.user.role);
        }
        return data;
    };

    const register = async (userData) => {
        const data = await authAPI.register(userData);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        authAPI.logout();
        setUser(null);
        localStorage.removeItem('role');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

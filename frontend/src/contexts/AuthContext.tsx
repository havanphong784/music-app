/* eslint-disable react-refresh/only-export-components */
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import axiosClient, {AUTH_UNAUTHORIZED_EVENT} from '../api/axiosClient';

export interface User {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
    created_at: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const login = useCallback((userData: User, token: string) => {
        localStorage.setItem('token', token);
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axiosClient.get('/me');
            setUser(response.data.user);
        } catch (error) {
            console.error('Lỗi khi kiểm tra xác thực:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void checkAuth();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [checkAuth]);

    useEffect(() => {
        const clearAuth = () => {
            setUser(null);
            setIsLoading(false);
        };

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuth);
        return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuth);
    }, []);

    const value = useMemo<AuthContextType>(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
    }), [user, isLoading, login, logout, checkAuth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

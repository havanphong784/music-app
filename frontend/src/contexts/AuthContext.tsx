/* eslint-disable react-refresh/only-export-components */
import type {ReactNode} from 'react';
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import axiosClient, {AUTH_UNAUTHORIZED_EVENT, refreshAccessToken} from '../api/axiosClient';
import {getAccessToken, setAccessToken} from '../auth/accessToken';

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
        setAccessToken(token);
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);

        try {
            if (!getAccessToken()) {
                await refreshAccessToken();
            }

            const response = await axiosClient.get<{ user: User }>('/me');
            setUser(response.data.user);
        } catch {
            setAccessToken(null);
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

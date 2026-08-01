import React, {createContext, type ReactNode, useContext, useEffect, useState} from "react";
import {logout as logoutApi, refreshToken, type User} from "../services/auth.ts";

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => Promise<void>;
    handleRefreshToken: () => Promise<void>;
}

export interface ProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<ProviderProps> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const handleRefreshToken = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await refreshToken();
            setAccessToken(response.accessToken);
            setUser(response.user);
        } catch {
            setUser(null);
            setAccessToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string, user: User) => {
        setAccessToken(token);
        setUser(user);
    };

    const logout = async (): Promise<void> => {
        try {
            await logoutApi();
        } catch {
            // Ignore error during logout API call
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    };

    useEffect(() => {
        handleRefreshToken();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoading,
                login,
                logout,
                handleRefreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};


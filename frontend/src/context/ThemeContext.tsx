import React, {createContext, useContext, useEffect, useState} from "react";
import type {ProviderProps} from "./AuthContext.tsx";

type Theme = "light" | "dark";

export interface ThemeContextType {
    theme: Theme,
    toggleTheme: () => void,
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ProviderProps> = ({children}) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem("theme") as Theme;
        if (savedTheme) return savedTheme;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{theme, toggleTheme}}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme phải được sử dụng bên trong ThemeProvider");
    }
    return context;
};
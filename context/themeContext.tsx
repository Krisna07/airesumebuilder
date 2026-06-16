'use client'
import { createContext, useState, ReactNode, useContext, useEffect } from 'react'

type Theme = {
    isDark:boolean;
};

type ThemeContextType = {
    theme: Theme;
    handleThemeChange: () => void;
};

 const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('UseTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Force light mode only for now - theme toggle is disabled
    const [theme, setTheme] = useState<Theme>({ isDark: false });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        // Force light mode - remove any stored theme preference
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setTheme({ isDark: false });
    }, []);

    const handleThemeChange = () => {
        // Theme toggle disabled - light mode only
        // Keeping function for future use when feature is improved
        if (typeof window === 'undefined') return;
    };

    return (
        <ThemeContext.Provider value={{ theme, handleThemeChange }}>
            {children}
        </ThemeContext.Provider>
    );
};
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
    const [theme, setTheme] = useState<Theme>({ isDark: false });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const stored = localStorage.getItem('theme');

        const initialIsDark =
            stored === 'dark' || (stored === null && media.matches);

        root.classList.toggle('dark', initialIsDark);
        setTheme({ isDark: initialIsDark });

        const handleChange = (event: MediaQueryListEvent) => {
            if (localStorage.getItem('theme')) return;
            root.classList.toggle('dark', event.matches);
            setTheme({ isDark: event.matches });
        };

        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    const handleThemeChange = () => {
        if (typeof window === 'undefined') return;

        setTheme(prev => {
            const next = !prev.isDark;
            const root = document.documentElement;
            root.classList.toggle('dark', next);

            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (next === prefersDark) {
                localStorage.removeItem('theme');
            } else {
                localStorage.setItem('theme', next ? 'dark' : 'light');
            }

            return { isDark: next };
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, handleThemeChange }}>
            {children}
        </ThemeContext.Provider>
    );
};
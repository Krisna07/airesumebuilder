import  { createContext,  useState,  ReactNode, useContext  } from 'react'

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
    const [theme, setTheme] = useState<Theme>({
        isDark: false
    });

    const handleThemeChange = () => {
        setTheme({ isDark: !theme.isDark });
    };



    return (
        <ThemeContext.Provider value={{ theme, handleThemeChange }}>
            {children}
        </ThemeContext.Provider>
    );
};
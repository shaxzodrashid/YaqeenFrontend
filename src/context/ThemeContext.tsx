import React, { createContext, useContext, useEffect, useState } from 'react';
import { animateAppearanceChange, type PositionOrigin } from '../utils/appearanceTransition';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: PositionOrigin) => void;
  setTheme: (theme: Theme, event?: PositionOrigin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('yaqeen-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    return media.matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme, event?: PositionOrigin) => {
    if (newTheme === theme) return;
    animateAppearanceChange(event, () => {
      setThemeState(newTheme);
      localStorage.setItem('yaqeen-theme', newTheme);
    });
  };

  const toggleTheme = (event?: PositionOrigin) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    animateAppearanceChange(event, () => {
      setThemeState(nextTheme);
      localStorage.setItem('yaqeen-theme', nextTheme);
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


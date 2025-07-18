import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: (_t) => {},
  custom:   { primary: '', accent: '' },
  setCustom: (_c) => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );
  const [custom, setCustom] = useState(
    () => JSON.parse(localStorage.getItem('customTheme') || '{}')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme === 'custom') {
      document.documentElement.style.setProperty('--primary-color', custom.primary);
      document.documentElement.style.setProperty('--accent-color',  custom.accent);
    }
    localStorage.setItem('customTheme', JSON.stringify(custom));
  }, [custom, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, custom, setCustom }}>
      {children}
    </ThemeContext.Provider>
  );
}

import { createContext, useContext, useReducer, ReactNode } from 'react';

const ThemeContext = createContext({
  state: { primaryColor: '#6366f1', accentColor: '#f97316', isDarkMode: false },
  dispatch: () => null,
});

function themeReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_COLORS':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, {
    primaryColor: '#6366f1',
    accentColor: '#f97316',
    isDarkMode: false,
  });
  
  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
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

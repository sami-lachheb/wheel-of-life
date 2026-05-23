import { createContext, useContext, useReducer } from 'react';

const initialToken = localStorage.getItem('token') || null;
const initialUsername = localStorage.getItem('username') || null;
const initialCompletedOnboarding = localStorage.getItem('completed_onboarding') === 'true';
const initialAspects = (() => {
  try {
    const temp = localStorage.getItem('temp_onboarding_aspects');
    return temp ? JSON.parse(temp) : [];
  } catch (_) {
    return [];
  }
})();

const UserContext = createContext({
  state: { 
    aspects: initialAspects, 
    currentWheel: { aspects: [], lastUpdated: '' }, 
    completedOnboarding: initialCompletedOnboarding,
    token: initialToken,
    username: initialUsername,
    isAuthenticated: !!initialToken,
    isSynced: false
  },
  dispatch: () => null,
});

function userReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      localStorage.removeItem('completed_onboarding');
      localStorage.removeItem('temp_onboarding_aspects');
      localStorage.removeItem('temp_onboarding_rate_index');
      return {
        ...state,
        token: action.payload.token,
        username: action.payload.username,
        isAuthenticated: true,
        completedOnboarding: false,
        aspects: [],
        isSynced: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('completed_onboarding');
      localStorage.removeItem('temp_onboarding_aspects');
      localStorage.removeItem('temp_onboarding_rate_index');
      return {
        ...state,
        token: null,
        username: null,
        isAuthenticated: false,
        completedOnboarding: false,
        aspects: [],
        isSynced: false
      };
    case 'SET_ASPECTS':
      localStorage.setItem('temp_onboarding_aspects', JSON.stringify(action.payload));
      return { ...state, aspects: action.payload };
    case 'UPDATE_ASPECT':
      const updatedAspects = state.aspects.map((a) =>
        a.name === action.payload.name ? { ...a, ...action.payload } : a
      );
      localStorage.setItem('temp_onboarding_aspects', JSON.stringify(updatedAspects));
      return {
        ...state,
        aspects: updatedAspects,
      };
    case 'SET_WHEEL':
      return { ...state, currentWheel: action.payload };
    case 'COMPLETE_ONBOARDING':
      localStorage.setItem('completed_onboarding', 'true');
      localStorage.removeItem('temp_onboarding_aspects');
      localStorage.removeItem('temp_onboarding_rate_index');
      return { ...state, completedOnboarding: true };
    case 'SYNC_USER_STATE':
      if (action.payload.completedOnboarding) {
        localStorage.setItem('completed_onboarding', 'true');
      } else {
        localStorage.removeItem('completed_onboarding');
      }
      return {
        ...state,
        aspects: action.payload.aspects || [],
        completedOnboarding: !!action.payload.completedOnboarding,
        isSynced: true
      };
    default:
      return state;
  }
}

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, {
    aspects: initialAspects,
    vision: '',
    currentWheel: {
      aspects: [],
      lastUpdated: new Date().toISOString(),
    },
    completedOnboarding: initialCompletedOnboarding,
    token: initialToken,
    username: initialUsername,
    isAuthenticated: !!initialToken,
    isSynced: false
  });
  
  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

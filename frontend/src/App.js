import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage.js';
import Onboarding from './pages/Onboarding.js';
import Dashboard from './pages/Dashboard.js';
import Journal from './pages/Journal.js';
import Coach from './pages/Coach.js';
import Wheel from './pages/Wheel.js';
import Tasks from './pages/Tasks.js';
import Profile from './pages/Profile.js';
import Login from './pages/Login.js';
import Navbar from './components/layout/Navbar.js';
import { useUser } from './contexts/UserContext.js';
import { getUserState } from './utils/api.js';

function ProtectedRoute({ children }) {
  const { state } = useUser();
  if (!state.isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }
  if (!state.completedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  const { state } = useUser();
  const location = useLocation();
  
  if (location.pathname === '/coach') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {children}
      </div>
    );
  }
  
  const padClass = state.isAuthenticated ? "pb-24 pt-4" : "pt-16";
  return (
    <div className={`${padClass} min-h-screen bg-light-gray flex flex-col transition-all duration-300`}>
      <Navbar />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

function App() {
  const { state, dispatch } = useUser();

  useEffect(() => {
    if (state.isAuthenticated && !state.isSynced) {
      getUserState()
        .then((data) => {
          dispatch({
            type: 'SYNC_USER_STATE',
            payload: {
              aspects: data?.aspects || [],
              completedOnboarding: !!data?.completedOnboarding,
            },
          });
        })
        .catch((err) => {
          console.error('Failed to sync auth state', err);
          if (err.status === 401) {
            dispatch({ type: 'LOGOUT' });
          }
        });
    }
  }, [state.isAuthenticated, state.isSynced, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Navigate to="/onboarding/aspects" replace />} />
      <Route path="/onboarding/aspects" element={<Onboarding />} />
      <Route path="/onboarding/rates" element={<Onboarding />} />
      <Route path="/onboarding/preview" element={<Onboarding />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><AppLayout><Journal /></AppLayout></ProtectedRoute>} />
      <Route path="/coach" element={<ProtectedRoute><AppLayout><Coach /></AppLayout></ProtectedRoute>} />
      <Route path="/wheel" element={<ProtectedRoute><AppLayout><Wheel /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { loginUser, registerUser, getUserState } from '../utils/api.js';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated and completed onboarding
  useEffect(() => {
    if (state.isAuthenticated && state.completedOnboarding) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, state.completedOnboarding, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // Sign Up Flow
        await registerUser(username, password);
      }
      
      // Authenticate
      const loginRes = await loginUser(username, password);
      dispatch({ 
        type: 'LOGIN', 
        payload: { token: loginRes.access_token, username } 
      });

      // Fetch user's saved DB state
      try {
        const dbState = await getUserState();
        if (dbState) {
          if (dbState.aspects && dbState.aspects.length > 0) {
            dispatch({ type: 'SET_ASPECTS', payload: dbState.aspects });
          }
          if (dbState.completedOnboarding) {
            dispatch({ type: 'COMPLETE_ONBOARDING' });
            navigate('/dashboard');
            return;
          }
        }
        // If state doesn't exist or not completed, go to onboarding aspects
        navigate('/onboarding/aspects');
      } catch (stateErr) {
        console.error('Failed to retrieve user state after login:', stateErr);
        navigate('/onboarding/aspects');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-gray flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-primary mb-2">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin 
              ? 'Log in to sync and view your Wheel of Life.' 
              : 'Create an account to save your balance configurations.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                placeholder="sami"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold-dark transition-all text-sm shadow-sm disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs font-bold text-gold hover:text-gold-dark transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign Up" 
              : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}

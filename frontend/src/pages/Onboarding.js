import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { validateAspectCount } from '../utils/validators.js';
import WheelVisualization from '../components/ui/WheelVisualization.js';
import { registerUser, loginUser, updateUserState } from '../utils/api.js';
import { 
  Heart, 
  Coins, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Smile, 
  Home, 
  Globe, 
  Sparkles, 
  User,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  Lock,
  UserCheck
} from 'lucide-react';

const DEFAULT_ASPECTS = [
  'Health & Fitness',
  'Finance & Wealth',
  'Relationships & Family',
  'Career & Work',
  'Personal Growth',
  'Fun & Recreation',
  'Environment',
  'Community',
  'Spirituality',
  'Partner & Love',
];

const ASPECT_ICONS = {
  'Health & Fitness': Heart,
  'Finance & Wealth': Coins,
  'Relationships & Family': Users,
  'Career & Work': Briefcase,
  'Personal Growth': TrendingUp,
  'Fun & Recreation': Smile,
  'Environment': Home,
  'Community': Globe,
  'Spirituality': Sparkles,
  'Partner & Love': User,
};

const ASPECT_QUESTIONS = {
  'Health & Fitness': 'What does peak physical vitality and fitness look like for you?',
  'Finance & Wealth': 'What does financial peace of mind and abundance mean to you?',
  'Relationships & Family': 'Describe your ideal relationships with family, friends, and loved ones.',
  'Career & Work': 'What is your ultimate professional impact, achievement, or work environment?',
  'Personal Growth': 'In what ways do you want to learn, grow, or expand your mind and skills?',
  'Fun & Recreation': 'How do you want to play, rest, create, or enjoy your life\'s leisure time?',
  'Environment': 'Describe your ideal living space, workspace, and immediate surroundings.',
  'Community': 'How do you want to contribute, connect, and serve the society or groups around you?',
  'Spirituality': 'What does deep inner peace, connection, and spiritual alignment feel like to you?',
  'Partner & Love': 'What does a deep, loving, and supportive romantic partnership look like to you?',
};

function getAspectIcon(name, sizeClass = "w-6 h-6") {
  const IconComponent = ASPECT_ICONS[name] || Compass;
  return <IconComponent className={sizeClass} />;
}

function getAspectQuestion(name) {
  return ASPECT_QUESTIONS[name] || 'What is your ultimate vision and target state for this area of your life?';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useUser();

  // Determine current step from pathname
  let step = 1; // 1: Aspects, 2: Rates, 3: Preview
  if (location.pathname === '/onboarding/rates') {
    step = 2;
  } else if (location.pathname === '/onboarding/preview') {
    step = 3;
  }

  // Step 1 local state: selected aspects
  const [selectedAspects, setSelectedAspects] = useState(
    state.aspects.map(a => a.name) || []
  );

  // Step 2 local state: aspect rating progress index
  const [rateIndex, setRateIndex] = useState(() => {
    const saved = localStorage.getItem('temp_onboarding_rate_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleRateIndexChange = (newIndex) => {
    setRateIndex(newIndex);
    localStorage.setItem('temp_onboarding_rate_index', newIndex.toString());
  };

  // Step 3 local state: post-onboarding auth gate trigger
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Sync state if user loads Onboarding page
  useEffect(() => {
    if (step === 1) {
      setSelectedAspects(state.aspects.map(a => a.name) || []);
    }
  }, [step, state.aspects]);

  // Route protection guards for in-memory flow
  useEffect(() => {
    if (state.isAuthenticated && state.completedOnboarding) {
      navigate('/dashboard');
      return;
    }
    if (step > 1 && selectedAspects.length === 0) {
      navigate('/onboarding/aspects');
    }
  }, [step, selectedAspects, state.isAuthenticated, state.completedOnboarding, navigate]);

  // Guard rateIndex within aspect length boundaries
  useEffect(() => {
    if (rateIndex >= state.aspects.length && state.aspects.length > 0) {
      handleRateIndexChange(state.aspects.length - 1);
    }
  }, [state.aspects, rateIndex]);

  const handleAspectToggle = (aspect) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect)
        ? prev.filter((a) => a !== aspect)
        : [...prev, aspect]
    );
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    const validation = validateAspectCount(selectedAspects);
    if (!validation.valid) {
      setErrors({ aspects: validation.error });
      return;
    }
    setErrors({});
    
    // Sync aspects context container structure
    const initializedAspects = selectedAspects.map((name) => {
      const existing = state.aspects.find(a => a.name === name);
      return existing || { name, score: 5, vision: '' };
    });
    dispatch({ type: 'SET_ASPECTS', payload: initializedAspects });
    
    navigate('/onboarding/rates');
  };

  // Step 2 Rating & Specific Visions updates
  const currentAspect = state.aspects[rateIndex];

  const handleStep2UpdateScore = (score) => {
    const updated = state.aspects.map((a, idx) => 
      idx === rateIndex ? { ...a, score } : a
    );
    dispatch({ type: 'SET_ASPECTS', payload: updated });
  };

  const handleStep2UpdateVision = (vision) => {
    const updated = state.aspects.map((a, idx) => 
      idx === rateIndex ? { ...a, vision } : a
    );
    dispatch({ type: 'SET_ASPECTS', payload: updated });
  };

  const handleRateNext = () => {
    if (rateIndex < state.aspects.length - 1) {
      handleRateIndexChange(rateIndex + 1);
    } else {
      navigate('/onboarding/preview');
    }
  };

  const handleRateBack = () => {
    if (rateIndex > 0) {
      handleRateIndexChange(rateIndex - 1);
    } else {
      navigate('/onboarding/aspects');
    }
  };

  // Step 3 finish trigger
  const handleFinishClick = () => {
    if (state.isAuthenticated) {
      syncStateAndOpenDashboard();
    } else {
      setShowAuthGate(true);
    }
  };

  const syncStateAndOpenDashboard = async () => {
    try {
      await updateUserState({
        vision: '',
        completedOnboarding: true,
        aspects: state.aspects
      });
      dispatch({
        type: 'SYNC_USER_STATE',
        payload: {
          aspects: state.aspects,
          completedOnboarding: true
        }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        dispatch({ type: 'LOGOUT' });
        setShowAuthGate(true);
        setAuthError('Your session has expired. Please sign up or log in to save your results.');
      } else {
        setErrors({ global: 'Failed to save wheel to the database' });
      }
    }
  };

  const handleAuthGateSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError('Username and password are required');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await registerUser(usernameInput, passwordInput);
      }
      const loginRes = await loginUser(usernameInput, passwordInput);
      
      dispatch({ 
        type: 'LOGIN', 
        payload: { token: loginRes.access_token, username: usernameInput } 
      });
      
      localStorage.setItem('token', loginRes.access_token);
      localStorage.setItem('username', usernameInput);
      
      await updateUserState({
        vision: '',
        completedOnboarding: true,
        aspects: state.aspects
      });
      
      dispatch({
        type: 'SYNC_USER_STATE',
        payload: {
          aspects: state.aspects,
          completedOnboarding: true
        }
      });
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // RENDER STEP 2: Rating & Specific Vision (Focus Mode)
  if (step === 2 && currentAspect) {
    const progressPercent = ((rateIndex + 1) / state.aspects.length) * 100;
    const currentScore = currentAspect.score || 5;
    const currentVision = currentAspect.vision || '';
    const aspectQuestion = getAspectQuestion(currentAspect.name);

    return (
      <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-8 animate-fade-in select-none">
        {/* Progress Header */}
        <div className="max-w-2xl w-full mx-auto pt-4">
          <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-gray-400 mb-2">
            <span>Aspect Rating</span>
            <span>Aspect {rateIndex + 1} of {state.aspects.length}</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Rating Area */}
        <div className="max-w-2xl w-full mx-auto my-auto py-6 flex flex-col items-center">
          {/* Large Aspect Icon */}
          <div className="mb-4 p-5 bg-primary text-gold rounded-full shadow-md">
            {getAspectIcon(currentAspect.name, "w-12 h-12")}
          </div>

          <h2 className="text-3xl font-extrabold text-primary mb-1 text-center">
            {currentAspect.name}
          </h2>
          <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">
            Set your satisfaction score and outline your vision for this area of life.
          </p>

          {/* satisfaction score selection */}
          <div className="w-full bg-light-gray rounded-2xl p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-700">Satisfaction Score right now:</span>
              <span className="text-3xl font-black text-gold bg-primary px-4 py-1 rounded-xl shadow-sm">
                {currentScore} <span className="text-xs text-white/50 font-normal">/10</span>
              </span>
            </div>
            
            <input
              type="range"
              min="1"
              max="10"
              value={currentScore}
              onChange={(e) => handleStep2UpdateScore(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            
            <div className="flex justify-between text-xs text-gray-400 font-bold mt-2 px-1">
              <span>Low Satisfaction (1)</span>
              <span>Highly Satisfied (10)</span>
            </div>
          </div>

          {/* Aspect Vision Textarea */}
          <div className="w-full">
            <label className="block text-sm font-bold text-primary mb-3">
              {aspectQuestion}
            </label>
            <textarea
              value={currentVision}
              onChange={(e) => handleStep2UpdateVision(e.target.value)}
              placeholder="Describe your ideal state or targets for this area..."
              rows="4"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none resize-none text-sm transition-all shadow-inner bg-gray-50/50"
            />
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="max-w-2xl w-full mx-auto pb-4 flex justify-between gap-4">
          <button
            onClick={handleRateBack}
            className="flex items-center gap-1.5 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm sm:text-base transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <button
            onClick={handleRateNext}
            className="flex items-center gap-1.5 px-8 py-3 bg-gold text-primary font-bold rounded-xl text-sm sm:text-base hover:bg-gold-dark transition-all duration-200"
          >
            {rateIndex === state.aspects.length - 1 ? 'Preview Wheel' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // RENDER STEPS 1, 3 (Standard Layout)
  return (
    <div className="min-h-screen bg-light-gray py-8 px-4 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 200 200" className="w-12 h-12">
              <circle cx="100" cy="100" r="90" fill="#6366f1" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="#f97316" strokeWidth="2" />
              <path d="M100,100 L100,10" stroke="#f97316" strokeWidth="2" />
              <path d="M100,100 L190,100" stroke="#f97316" strokeWidth="2" />
              <path d="M100,100 L100,190" stroke="#f97316" strokeWidth="2" />
              <path d="M100,100 L10,100" stroke="#f97316" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-1">Wheel of Life</h1>
          <p className="text-gray-500 text-sm">Your journey to balanced living</p>
        </div>

        {/* Step Indicator dots */}
        <div className="mb-8 max-w-md mx-auto font-sans">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-gold -translate-y-1/2 transition-all duration-500 z-0"
              style={{ width: `${((step === 1 ? 1 : step === 2 ? 2 : 3) - 1) / 2 * 100}%` }}
            />

            {[
              { num: 1, label: 'Aspects' },
              { num: 2, label: 'Ratings' },
              { num: 3, label: 'Preview' }
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step >= s.num ? 'bg-primary text-white border-2 border-gold shadow-sm' : 'bg-white text-gray-400 border border-gray-200'
                }`}>
                  {s.num}
                </div>
                <span className={`text-[10px] font-bold mt-1 ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Aspect Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 transition-opacity duration-300">
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary mb-2 text-center">
              Which areas of your life are most important to you?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Select 3 to 10 key aspects of life that you want to track and balance.
            </p>
            
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_ASPECTS.map((aspect) => {
                  const isSelected = selectedAspects.includes(aspect);
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => handleAspectToggle(aspect)}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-150 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-gold text-primary' : 'bg-light-gray text-primary'}`}>
                        {getAspectIcon(aspect)}
                      </div>
                      <span className="font-semibold text-sm">{aspect}</span>
                    </button>
                  );
                })}
              </div>
              
              {errors.aspects && (
                <p className="text-red-500 text-sm font-semibold text-center mt-3">{errors.aspects}</p>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-8 py-3.5 bg-gold text-primary font-extrabold rounded-xl hover:bg-gold-dark transition-all duration-200 text-sm"
                >
                  Continue to Ratings
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Interactive Wheel Preview */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 transition-opacity duration-300">
            {!showAuthGate ? (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-primary mb-1 text-center">
                  Your Interactive Wheel of Life
                </h2>
                <p className="text-gray-500 text-xs text-center mb-6">
                  Review your ratings. Persist your progress to database to unlock your dashboard.
                </p>

                {errors.global && (
                  <p className="text-red-500 text-sm font-semibold text-center mb-4">{errors.global}</p>
                )}

                <div className="flex flex-col items-center gap-6 justify-center">
                  <div className="w-full max-w-[280px] flex justify-center">
                    <WheelVisualization aspects={state.aspects} />
                  </div>

                  <div className="w-full space-y-3">
                    <h3 className="text-sm font-bold text-primary border-b pb-1.5">Aspects Overview</h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {state.aspects.map((aspect) => (
                        <div key={aspect.name} className="flex justify-between items-center p-3 bg-light-gray rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{getAspectIcon(aspect.name)}</span>
                            <span className="font-bold text-xs text-gray-800">{aspect.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {aspect.vision && (
                              <span className="text-[10px] text-gray-400 max-w-[120px] truncate italic">
                                "{aspect.vision}"
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-primary text-gold font-bold text-xs rounded">
                              {aspect.score}/10
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      handleRateIndexChange(state.aspects.length - 1);
                      navigate('/onboarding/rates');
                    }}
                    className="flex items-center gap-1.5 px-5 py-3 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleFinishClick}
                    className="flex items-center gap-1.5 px-6 py-3 bg-gold text-primary font-bold rounded-xl hover:bg-gold-dark text-sm shadow-sm"
                  >
                    Finish & Save Wheel
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              // Auth Gate Form triggered after Preview
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-primary mb-1">Save Your Results</h3>
                  <p className="text-gray-400 text-sm">
                    Create a secure account to save your wheel configuration and open your dashboard.
                  </p>
                </div>

                {/* Toggle tabs */}
                <div className="flex bg-light-gray p-1 rounded-xl mb-6 max-w-xs mx-auto">
                  <button
                    onClick={() => { setIsSignUp(true); setAuthError(''); }}
                    className={`flex-1 py-2 text-center font-bold text-xs rounded-lg transition-colors ${
                      isSignUp ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setIsSignUp(false); setAuthError(''); }}
                    className={`flex-1 py-2 text-center font-bold text-xs rounded-lg transition-colors ${
                      !isSignUp ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    Log In
                  </button>
                </div>

                <form onSubmit={handleAuthGateSubmit} className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Choose a username..."
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>

                  {authError && (
                    <p className="text-red-500 text-xs font-semibold mt-1">{authError}</p>
                  )}

                  <div className="flex justify-between gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAuthGate(false)}
                      className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-xs transition-colors"
                    >
                      Back to Preview
                    </button>
                    
                    <button
                      type="submit"
                      disabled={authLoading}
                      className={`flex-1 py-3.5 font-black rounded-xl text-center text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        authLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gold text-primary hover:bg-gold-dark hover:shadow-lg'
                      }`}
                    >
                      {authLoading ? (
                        'Saving...'
                      ) : (
                        <>
                          {isSignUp ? <UserCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {isSignUp ? 'Create & Save' : 'Log In & Save'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

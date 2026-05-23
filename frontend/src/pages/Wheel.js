import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { useWheel } from '../hooks/useWheel.js';
import { updateUserState } from '../utils/api.js';
import WheelVisualization, { getNormalizedAspects, CANONICAL_ASPECTS } from '../components/ui/WheelVisualization.js';
import { 
  Briefcase, 
  Heart, 
  Users, 
  Lightbulb, 
  Coins, 
  Smile, 
  Home, 
  PiggyBank,
  LayoutGrid,
  Target,
  User,
  X,
  Check
} from 'lucide-react';

export default function Wheel() {
  const navigate = useNavigate();
  const { state, dispatch } = useUser();
  const { aspects } = useWheel();

  // Local state for the interactive bottom-sheet editor
  const [editingAspect, setEditingAspect] = useState(null); // aspect object or null
  const [editScore, setEditScore] = useState(5);
  const [editVision, setEditVision] = useState('');
  const [editActionSteps, setEditActionSteps] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Normalize aspects to the 8 canonical ones for display
  const normalizedAspects = getNormalizedAspects(aspects);

  // Calculate overall balance score (average of the 8 canonical aspects)
  const totalScore = normalizedAspects.reduce((sum, a) => sum + (a.score || 0), 0);
  const overallScore = normalizedAspects.length > 0 ? (totalScore / normalizedAspects.length).toFixed(1) : '0.0';

  const username = state.username || 'Alex J.';

  // Open the bottom sheet editor for a specific aspect
  const handleOpenEditor = (aspectName) => {
    // Find the normalized aspect to edit
    const aspect = normalizedAspects.find(a => a.name.toLowerCase() === aspectName.toLowerCase() || a.originalName.toLowerCase() === aspectName.toLowerCase());
    if (aspect) {
      setEditingAspect(aspect);
      setEditScore(aspect.score);
      setEditVision(aspect.vision);
      setEditActionSteps(aspect.actionSteps);
    }
  };

  // Save changes from bottom sheet editor
  const handleSave = async () => {
    if (!editingAspect) return;
    setIsSaving(true);

    // Create a copy of the current aspects list in state
    const updatedAspects = [...state.aspects];
    
    // Find matching canonical aspect mapping info
    const canonical = CANONICAL_ASPECTS.find(c => c.name.toLowerCase() === editingAspect.name.toLowerCase());
    
    // Check if we can find a matching aspect in current user aspects
    let aspectIndex = -1;
    if (canonical) {
      aspectIndex = updatedAspects.findIndex(a => 
        canonical.dbKeys.some(key => a.name.toLowerCase() === key.toLowerCase())
      );
    } else {
      aspectIndex = updatedAspects.findIndex(a => a.name.toLowerCase() === editingAspect.name.toLowerCase());
    }

    const updatedObject = {
      name: aspectIndex !== -1 ? updatedAspects[aspectIndex].name : editingAspect.name,
      score: editScore,
      vision: editVision,
      actionSteps: editActionSteps
    };

    if (aspectIndex !== -1) {
      updatedAspects[aspectIndex] = updatedObject;
    } else {
      updatedAspects.push(updatedObject);
    }

    // Update locally in context
    dispatch({ type: 'SET_ASPECTS', payload: updatedAspects });

    // Sync to backend database
    try {
      await updateUserState({
        aspects: updatedAspects,
        completedOnboarding: true
      });
      setToastMessage('Score updated successfully');
      setTimeout(() => setToastMessage(null), 3000);
      setEditingAspect(null);
    } catch (error) {
      console.error("Failed to sync aspect changes to server:", error);
      setToastMessage('Error syncing changes to server');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Bottom Navigation helper to trigger mock features or route
  const handleTabClick = (tab) => {
    if (tab === 'dashboard') {
      navigate('/dashboard');
    } else if (tab === 'goals') {
      navigate('/tasks');
    } else if (tab === 'community') {
      setToastMessage('Community space coming soon!');
      setTimeout(() => setToastMessage(null), 3000);
    } else if (tab === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-100 flex justify-center items-start overflow-y-auto">
      
      {/* Container matching mobile frame dimensions */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col justify-between shadow-2xl relative pb-28 pt-4 px-5">
        
        {/* Header containing logo and user profile details */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {/* Hexagon Rainbow Wheel Logo */}
            <svg viewBox="0 0 100 100" className="w-9 h-9">
              <path d="M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z" fill="none" stroke="#6366F1" strokeWidth="5" />
              <path d="M 50 10 L 50 50 Z" stroke="#2196F3" strokeWidth="4" />
              <path d="M 85 30 L 50 50 Z" stroke="#4CAF50" strokeWidth="4" />
              <path d="M 85 70 L 50 50 Z" stroke="#FF9800" strokeWidth="4" />
              <path d="M 50 90 L 50 50 Z" stroke="#FFC107" strokeWidth="4" />
              <path d="M 15 70 L 50 50 Z" stroke="#E91E63" strokeWidth="4" />
              <path d="M 15 30 L 50 50 Z" stroke="#9C27B0" strokeWidth="4" />
            </svg>
            <span className="font-black text-slate-800 text-sm tracking-tight">Wheel of Life</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-slate-200/60 shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" 
              alt="Avatar" 
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-slate-700">{username}</span>
          </div>
        </div>

        {/* Overall Balance Score Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
          <h2 className="text-slate-800 text-base font-black leading-none mb-1">Overall Balance</h2>
          <div className="text-slate-700 text-[26px] font-black tracking-tight">
            Score: <span className="text-slate-800">{overallScore}/10</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Your Personal Wheel of Life</h1>
        </div>

        {/* Central Wheel component */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 flex justify-center items-center">
          <WheelVisualization 
            aspects={aspects} 
            onClick={handleOpenEditor} 
          />
        </div>

        {/* Score List Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5 flex-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Aspect Analysis</h3>
          <div className="space-y-4">
            {normalizedAspects.map((aspect) => (
              <div 
                key={aspect.name} 
                onClick={() => handleOpenEditor(aspect.name)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {/* Aspect Icon Badge */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: aspect.color }}
                >
                  <aspect.Icon className="w-4 h-4" />
                </div>
                
                {/* Details and Progress Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[13px] font-bold text-slate-700 truncate">{aspect.name}</span>
                    <span className="text-[13px] font-black text-slate-800">{aspect.score.toFixed(1)}</span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: aspect.color, 
                        width: `${aspect.score * 10}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action button below the scores list */}
          <button
            onClick={() => handleOpenEditor('Career')}
            className="w-full mt-6 py-3.5 bg-[#2196F3] text-white font-extrabold text-sm rounded-xl hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/10 active:scale-[0.99]"
          >
            Update Scores
          </button>
        </div>

        {/* Custom Bottom Tab Navigation (Mockup Style) */}
        <div className="absolute bottom-5 left-5 right-5 z-40 bg-white border border-slate-200/50 rounded-2xl py-2 px-6 shadow-lg flex justify-between items-center">
          <button 
            onClick={() => handleTabClick('dashboard')}
            className="flex flex-col items-center gap-1 text-[#2196F3]"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[9px] font-extrabold tracking-wider">Dashboard</span>
          </button>
          
          <button 
            onClick={() => handleTabClick('goals')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Target className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider">Goals</span>
          </button>
          
          <button 
            onClick={() => handleTabClick('community')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider">Community</span>
          </button>
          
          <button 
            onClick={() => handleTabClick('profile')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider">Profile</span>
          </button>
        </div>

        {/* Dynamic score updated Toast alert */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg animate-bounce flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            {toastMessage}
          </div>
        )}

        {/* Interactive Aspect Score Editor Bottom-Sheet Modal */}
        {editingAspect && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex flex-col justify-end transition-opacity duration-300">
            {/* Modal backdrop closer */}
            <div className="flex-1" onClick={() => setEditingAspect(null)} />
            
            {/* Bottom Sheet Panel */}
            <div className="bg-white rounded-t-3xl p-6 shadow-2xl max-w-[430px] w-full mx-auto border-t border-slate-100 flex flex-col gap-4 animate-slide-up relative">
              
              {/* Top Drag bar / Handle Indicator */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-1 pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setEditingAspect(null)}
                className="absolute top-5 right-5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Aspect Icon Header */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: editingAspect.color }}
                >
                  <editingAspect.Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-base leading-none mb-1">{editingAspect.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aspect Score Editor</p>
                </div>
              </div>

              {/* Interactive Score Slider */}
              <div className="bg-slate-50/50 border border-slate-200/40 rounded-2xl p-4.5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Score</span>
                  <span className="text-lg font-black" style={{ color: editingAspect.color }}>
                    {editScore.toFixed(1)} <span className="text-slate-400 text-xs font-bold">/ 10</span>
                  </span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={editScore}
                  onChange={(e) => setEditScore(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${editingAspect.color} 0%, ${editingAspect.color} ${(editScore - 1) / 9 * 100}%, #E2E8F0 ${(editScore - 1) / 9 * 100}%, #E2E8F0 100%)` 
                  }}
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-extrabold uppercase mt-2">
                  <span>1.0 Min</span>
                  <span>5.5 Mid</span>
                  <span>10.0 Peak</span>
                </div>
              </div>

              {/* Target Vision text-area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Target Vision</label>
                <textarea
                  value={editVision}
                  onChange={(e) => setEditVision(e.target.value)}
                  placeholder="What is your ultimate dream state or goal for this life aspect?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 text-xs font-medium focus:ring-1 focus:ring-slate-300 focus:outline-none min-h-[60px]"
                />
              </div>

              {/* Action Steps text-area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Immediate Action Steps</label>
                <textarea
                  value={editActionSteps}
                  onChange={(e) => setEditActionSteps(e.target.value)}
                  placeholder="What are the immediate practical steps you can take to move the needle?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 text-xs font-medium focus:ring-1 focus:ring-slate-300 focus:outline-none min-h-[60px]"
                />
              </div>

              {/* Save & Cancel buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEditingAspect(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  style={{ backgroundColor: editingAspect.color }}
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { createJournal } from '../utils/api.js';
import { ArrowLeft } from 'lucide-react';

const ASPECTS = ['Health & Fitness', 'Finance & Wealth', 'Relationships & Family', 'Career & Work', 'Personal Growth', 'Fun & Recreation', 'Environment', 'Community', 'Spirituality', 'Partner & Love'];
import EmotionSelectorSheet from '../components/ui/EmotionSelectorSheet.js';

export default function Journal() {
  const navigate = useNavigate();
  const { state } = useUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedAspects, setSelectedAspects] = useState([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // Sheets and popups states
  const [showEmotionSheet, setShowEmotionSheet] = useState(false);
  const [showAspectsSheet, setShowAspectsSheet] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [activeMoodTier, setActiveMoodTier] = useState(null);


  const toggleAspect = (aspect) => {
    setSelectedAspects(prev =>
      prev.includes(aspect) ? prev.filter(a => a !== aspect) : [...prev, aspect]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title || !content) return;
    setLoading(true);

    try {
      const entry = {
        title,
        content,
        emotions: selectedEmotions,
        aspects: selectedAspects,
        location: location || undefined,
      };

      await createJournal(entry);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create journal:', error);
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/50 via-purple-50/70 to-rose-100/50 py-6 px-5 flex flex-col justify-between overflow-hidden">
      
      {/* Inject slide-up sheet animations style */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Soft decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/15 rounded-full blur-2xl" />
      </div>

      <div className="w-full flex-1 flex flex-col relative z-10 pb-24">
        
        {/* Top Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider bg-white/60 px-3 py-1.5 rounded-full border border-gray-200/30 shadow-sm ring-1 ring-white/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          
          <span className="text-xs font-bold text-slate-500/80 tracking-wider">
            {currentDate}
          </span>

          <button
            onClick={handleSubmit}
            disabled={loading || !title || !content}
            className={`text-xs font-black uppercase tracking-widest transition-all ${
              (title && content)
                ? 'text-indigo-600 hover:text-indigo-800 scale-105 font-black'
                : 'text-gray-400 cursor-not-allowed opacity-50 font-bold'
            }`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Minimalistic Borderless Editor Area */}
        <div className="flex-1 flex flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="Untitled Entry"
            className="w-full bg-transparent text-2xl font-black text-slate-800 border-none outline-none focus:ring-0 placeholder-slate-400/70 py-2 mt-4"
          />
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full flex-1 bg-transparent text-base font-medium text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400/50 resize-none py-2 mt-2 leading-relaxed"
          />
        </div>

      </div>

      {/* Floating Location Overlay (renders right above toolbar) */}
      {showLocationInput && (
        <div className="fixed bottom-24 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-40 pointer-events-none">
          <div className="w-full bg-white/90 backdrop-blur-md border border-gray-200/30 rounded-2xl p-3 shadow-xl pointer-events-auto flex items-center gap-2 ring-1 ring-white/60">
            <span className="text-lg">📍</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you? (e.g. Cozy Cafe)"
              className="flex-1 bg-transparent text-xs font-bold text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400"
            />
            {location && (
              <button
                onClick={() => setLocation('')}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Journal Pinned Floating Toolbar */}
      <div className="fixed bottom-6 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-40 pointer-events-none">
        <div className="w-full bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-6 shadow-2xl flex justify-between items-center pointer-events-auto ring-1 ring-white/20">
          
          {/* Emotion Selector Toggle */}
          <button
            onClick={() => setShowEmotionSheet(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <span className="text-xl">😊</span>
            {selectedEmotions.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900 animate-pulse" />
            )}
          </button>

          {/* Location Input Toggle */}
          <button
            onClick={() => setShowLocationInput(!showLocationInput)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <span className="text-xl">📍</span>
            {location && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900" />
            )}
          </button>

          {/* Voice Record (Mocked) */}
          <button
            disabled
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full opacity-35 text-white cursor-not-allowed"
          >
            <span className="text-xl">🎙️</span>
          </button>

          {/* Affected Aspects Selector */}
          <button
            onClick={() => setShowAspectsSheet(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <span className="text-xl">✨</span>
            {selectedAspects.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900 animate-pulse" />
            )}
          </button>

        </div>
      </div>

      {/* Emotion Selector Component */}
      <EmotionSelectorSheet
        isOpen={showEmotionSheet}
        onClose={() => setShowEmotionSheet(false)}
        initialMood={activeMoodTier}
        initialTags={selectedEmotions}
        onSave={({ mood: savedMood, tags: savedTags, impacts: savedImpacts }) => {
          setActiveMoodTier(savedMood);
          setSelectedEmotions(savedTags);
          if (savedImpacts && savedImpacts.length > 0) {
            setSelectedAspects(prev => {
              const updated = [...prev];
              savedImpacts.forEach(impact => {
                const match = ASPECTS.find(a => a.toLowerCase().includes(impact.toLowerCase()) || impact.toLowerCase().includes(a.toLowerCase()));
                if (match && !updated.includes(match)) {
                  updated.push(match);
                }
              });
              return updated;
            });
          }
          setShowEmotionSheet(false);
        }}
      />

      {/* Aspects Sheet Overlay */}
      {showAspectsSheet && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end">
          <div className="absolute inset-0" onClick={() => setShowAspectsSheet(false)} />
          
          <div className="w-full bg-white rounded-t-[32px] p-6 shadow-2xl relative z-10 animate-slide-up max-w-[430px] mx-auto border-t border-gray-100">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-4">
              Affected Wheel Aspects
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ASPECTS.map((aspect) => {
                const active = selectedAspects.includes(aspect);
                return (
                  <button
                    key={aspect}
                    onClick={() => toggleAspect(aspect)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                      active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-slate-50 border-gray-200/20 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{aspect}</span>
                    {active && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAspectsSheet(false)}
              className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-800 transition-colors shadow-sm"
            >
              Confirm Aspects
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { createJournal, getJournalPrompt, getJournalSuggestion, getJournalReflection } from '../utils/api.js';
import { ArrowLeft, Home, Sparkles, ChevronRight, HelpCircle, Lightbulb, MessageSquare, MapPin, Smile, Mic } from 'lucide-react';
import appLogo from '../assets/logo.png';

const ASPECTS = ['Health & Fitness', 'Finance & Wealth', 'Relationships & Family', 'Career & Work', 'Personal Growth', 'Fun & Recreation', 'Environment', 'Community', 'Spirituality', 'Partner & Love'];
import EmotionSelectorSheet from '../components/ui/EmotionSelectorSheet.js';

const EMOTION_KEYWORDS = {
  sad: ['sad', 'unhappy', 'cry', 'crying', 'down', 'depressed', 'grief', 'lonely', 'blue'],
  anxious: ['anxious', 'stress', 'stressed', 'worried', 'worry', 'scared', 'fear', 'afraid', 'overwhelmed', 'nervous'],
  angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'hate', 'frustrated', 'rage'],
  happy: ['happy', 'glad', 'joy', 'excited', 'proud', 'awesome', 'great', 'good', 'grateful', 'blessed', 'content'],
  tired: ['tired', 'exhausted', 'sleepy', 'drain', 'drained', 'fatigue', 'weary', 'burnout']
};

export default function Journal() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { state } = useUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedAspects, setSelectedAspects] = useState(() => {
    const passed = locationState.state?.selectedAspect;
    return passed ? [passed] : [];
  });
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // Sheets and popups states
  const [showEmotionSheet, setShowEmotionSheet] = useState(false);
  const [showAspectsSheet, setShowAspectsSheet] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [activeMoodTier, setActiveMoodTier] = useState(null);

  // Prompt card states
  const [prompt, setPrompt] = useState('');
  const [promptCollapsed, setPromptCollapsed] = useState(false);

  // Suggestion & completions states
  const [suggestion, setSuggestion] = useState('');
  const [showHelperBubble, setShowHelperBubble] = useState(false);
  const [helperHeader, setHelperHeader] = useState('Getting stuck?');

  // Passive client-side emotion tagging states
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [showPill, setShowPill] = useState(false);

  // Post-save reflection summary
  const [reflectionSummary, setReflectionSummary] = useState(null);

  const textareaRef = useRef(null);
  const lastFetchTimeRef = useRef(0);

  // Fetch contextual prompt on load
  useEffect(() => {
    async function loadPrompt() {
      try {
        const res = await getJournalPrompt();
        if (res && res.prompt) {
          setPrompt(res.prompt);
        }
      } catch (err) {
        console.error("Failed to load prompt:", err);
      }
    }
    loadPrompt();
  }, []);

  // Fetch a contextual prompt helper nudge
  const triggerSuggestion = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      setShowHelperBubble(true);
      return;
    }
    lastFetchTimeRef.current = now;

    setHelperHeader("Reflection cue");

    try {
      const res = await getJournalSuggestion(content || "");
      if (res && res.suggestion) {
        setSuggestion(res.suggestion);
        setShowHelperBubble(true);
      }
    } catch (err) {
      console.error("Failed to fetch suggestion:", err);
    }
  }, [content]);

  // Debounced suggest fetcher (2.5 seconds pause trigger)
  useEffect(() => {
    if (!content) {
      return;
    }
    const timer = setTimeout(() => {
      triggerSuggestion();
    }, 2500);
    return () => clearTimeout(timer);
  }, [content, triggerSuggestion]);

  // Client-side emotion scanner
  useEffect(() => {
    if (!content) {
      setShowPill(false);
      return;
    }
    const words = content.toLowerCase().split(/\s+/);
    let matched = null;
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (words.some(word => keywords.includes(word))) {
        matched = emotion;
        break;
      }
    }
    if (matched) {
      const formatted = matched.charAt(0).toUpperCase() + matched.slice(1);
      if (selectedEmotions.includes(formatted)) {
        setShowPill(false);
        return;
      }
      setDetectedEmotion(matched);
      setShowPill(true);
      const timer = setTimeout(() => {
        setShowPill(false);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setShowPill(false);
    }
  }, [content, selectedEmotions]);

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

      const savedEntry = await createJournal(entry);
      const reflectRes = await getJournalReflection(savedEntry.id);
      setReflectionSummary({
        insight: reflectRes.insight,
        topic: reflectRes.suggested_coach_topic,
        emotions: selectedEmotions,
        aspects: selectedAspects
      });
    } catch (error) {
      console.error('Failed to create journal:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  const showEmotionDivider = content.length > 120 && selectedEmotions.length === 0;
  const showActionDivider = content.length > 250 && selectedEmotions.length > 0 && selectedAspects.length > 0;

  if (reflectionSummary) {
    return (
      <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/50 via-purple-50/70 to-rose-100/50 py-8 px-6 flex items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/15 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/15 rounded-full blur-2xl" />
        </div>

        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/60 relative z-10 ring-1 ring-white/60 animate-fade-in flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            
            <h2 className="text-xl font-black text-slate-800 mb-2">Reflection Logged</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary Insight</p>
            
            <div className="bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl mb-5">
              <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                "{reflectionSummary.insight}"
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {reflectionSummary.emotions.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Tagged Emotions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reflectionSummary.emotions.map(emo => (
                      <span key={emo} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                        {emo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reflectionSummary.aspects.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Mapped Areas</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reflectionSummary.aspects.map(asp => (
                      <span key={asp} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100/40">
                        {asp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {reflectionSummary.topic && (
                <div className="pt-2">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Recommended Coaching Focus</h4>
                  <p className="text-xs font-black text-indigo-600">{reflectionSummary.topic}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100/60">
            <button
              onClick={() => navigate('/coach', { state: { initialMessage: `Hey Riley, I just reflected on my journal entry about "${title}". The insight recommended we focus on: "${reflectionSummary.topic}". Let's dive into it.` } })}
              className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest shadow-md"
            >
              Talk with Riley
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 bg-slate-50 text-slate-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest border border-gray-200/20 shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/50 via-purple-50/70 to-rose-100/50 py-6 px-5 flex flex-col justify-between overflow-hidden">
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

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

        {/* Guided Prompt Scaffold Card */}
        {prompt && !promptCollapsed && (
          <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-xl relative z-20 ring-1 ring-white/60 mb-6 animate-slide-up">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 border border-indigo-100/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Guided Reflection Prompt
              </span>
              <button
                onClick={() => setPromptCollapsed(true)}
                className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest px-2"
              >
                Skip
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 leading-relaxed mb-4">
              "{prompt}"
            </h3>
            
            <div className="space-y-2 mb-5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Suggested Structure</p>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">1</span>
                <span><strong>Facts:</strong> What occurred?</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">2</span>
                <span><strong>Emotions:</strong> How did you feel about it?</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">3</span>
                <span><strong>Commitment:</strong> What is your next small step?</span>
              </div>
            </div>
            
            <button
              onClick={() => setPromptCollapsed(true)}
              className="w-full py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Start Writing
            </button>
          </div>
        )}

        {/* Collapsed minimized prompt banner */}
        {prompt && promptCollapsed && (
          <div className="mb-4 bg-indigo-50/30 border border-indigo-100/20 rounded-2xl p-3 flex justify-between items-center animate-fade-in">
            <div className="flex items-start gap-2.5 pr-2">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-slate-600 leading-snug">
                {prompt}
              </p>
            </div>
            <button
              onClick={() => setPromptCollapsed(false)}
              className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex-shrink-0"
            >
              Expand
            </button>
          </div>
        )}

        {/* Minimalistic Editor */}
        <div className="flex-1 flex flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            placeholder="Untitled Entry"
            className="w-full bg-transparent text-2xl font-black text-slate-800 border-none outline-none focus:ring-0 placeholder-slate-400/70 py-2 mt-4"
          />

          {/* Emerging progression nudges inside layout */}
          {showActionDivider && (
            <div className="w-full text-center text-[9px] font-black text-rose-500/80 uppercase tracking-widest my-3 select-none border-y border-rose-100/20 py-1.5 animate-pulse">
              — what will you do about it? —
            </div>
          )}
          {showEmotionDivider && !showActionDivider && (
            <div className="w-full text-center text-[9px] font-black text-indigo-500/80 uppercase tracking-widest my-3 select-none border-y border-indigo-100/20 py-1.5 animate-pulse">
              — how did that make you feel? —
            </div>
          )}
          
          <div className="flex-1 mt-2 min-h-[300px] flex flex-col relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSuggestion('');
                setShowHelperBubble(false);
              }}
              placeholder={prompt ? "" : "What's on your mind?"}
              className="w-full flex-1 bg-transparent text-base font-medium text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400/50 resize-none py-2 leading-relaxed"
            />
          </div>
        </div>

      </div>

      {/* Floating Passive Emotion Tagger Pill */}
      {showPill && detectedEmotion && (
        <div className="fixed bottom-24 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-40 animate-slide-up pointer-events-auto">
          <div className="w-full bg-indigo-600 text-white rounded-2xl p-3 shadow-xl flex items-center justify-between border border-indigo-500/50">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-white/90 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">
                Feeling {detectedEmotion}?
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const formatted = detectedEmotion.charAt(0).toUpperCase() + detectedEmotion.slice(1);
                  setSelectedEmotions(prev => prev.includes(formatted) ? prev : [...prev, formatted]);
                  setShowEmotionSheet(true);
                  setShowPill(false);
                }}
                className="bg-white text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xs hover:bg-slate-100"
              >
                Tag It
              </button>
              <button
                onClick={() => setShowPill(false)}
                className="text-white/80 hover:text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Help Bubble / Prompt Suggestion */}
      <div className="fixed bottom-28 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-40 pointer-events-none flex flex-col items-end gap-3">
        {/* Tooltip speech bubble */}
        {(suggestion || showHelperBubble) && (
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-xl border border-white/10 text-xs font-semibold leading-relaxed animate-slide-up flex flex-col gap-2 max-w-[280px] pointer-events-auto relative ring-1 ring-white/10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {helperHeader}
              </span>
              <button 
                onClick={() => {
                  setSuggestion('');
                  setShowHelperBubble(false);
                }}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest pl-2"
              >
                Hide
              </button>
            </div>
            <p className="text-slate-200">
              {suggestion || "Describe what happened today, how you felt about it, or one commitment you want to make."}
            </p>
            <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45" />
          </div>
        )}

        {/* Floating Help Circle Button */}
        <button
          onClick={() => {
            triggerSuggestion();
            setShowHelperBubble(true);
          }}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all border border-indigo-500/50 pointer-events-auto"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Location Overlay */}
      {showLocationInput && (
        <div className="fixed bottom-24 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-40 pointer-events-none">
          <div className="w-full bg-white/90 backdrop-blur-md border border-gray-200/30 rounded-2xl p-3 shadow-xl pointer-events-auto flex items-center gap-2 ring-1 ring-white/60">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
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
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <img src={appLogo} alt="Home" className="w-full h-full p-1.5 object-contain opacity-80 hover:opacity-100 transition-all" />
          </button>

          <button
            onClick={() => setShowEmotionSheet(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <Smile className="w-5 h-5" />
            {selectedEmotions.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setShowLocationInput(!showLocationInput)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <MapPin className="w-5 h-5" />
            {location && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900" />
            )}
          </button>

          <button
            disabled
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full opacity-35 text-white cursor-not-allowed"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowAspectsSheet(true)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white relative"
          >
            <Sparkles className="w-5 h-5" />
            {selectedAspects.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full border border-slate-900 animate-pulse" />
            )}
          </button>

        </div>
      </div>

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

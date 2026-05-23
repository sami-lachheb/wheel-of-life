import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WheelVisualization from '../components/ui/WheelVisualization.js';
import { useWheel } from '../hooks/useWheel.js';
import { getJournals, getTasks, toggleTaskCompletion, getUserState, updateUserState } from '../utils/api.js';
import { useUser } from '../contexts/UserContext.js';
import { BookOpen, MessageSquare, Disc, ClipboardCheck, CheckCircle2, Circle, Trophy, Target, Lightbulb, Star, Flame, Smile } from 'lucide-react';
import EmotionSelectorSheet from '../components/ui/EmotionSelectorSheet.js';
import IconBadge from '../components/ui/IconBadge.js';
import MoodSlider from '../components/ui/MoodSlider.js';
import MoodBloom, { getMoodTheme } from '../components/ui/MoodBloom.js';

export default function Dashboard() {
  const { aspects, getAverageScore } = useWheel();
  const { state, dispatch } = useUser();
  const [journals, setJournals] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [mood, setMood] = useState(() => {
    const logged = localStorage.getItem('user_mood_log');
    if (logged) {
      try {
        const parsed = JSON.parse(logged);
        const diff = (new Date() - new Date(parsed.timestamp)) / 3600000;
        if (diff < 12.0) return parsed.mood || 'okay';
      } catch (_) {}
    }
    return 'okay';
  });
  
  const [moodLog, setMoodLog] = useState(() => {
    const logged = localStorage.getItem('user_mood_log');
    if (logged) {
      try {
        const parsed = JSON.parse(logged);
        const diff = (new Date() - new Date(parsed.timestamp)) / 3600000;
        if (diff < 12.0) return parsed;
      } catch (_) {}
    }
    return null;
  });

  const [pleasantness, setPleasantness] = useState(() => {
    const logged = localStorage.getItem('user_mood_log');
    if (logged) {
      try {
        const parsed = JSON.parse(logged);
        const diff = (new Date() - new Date(parsed.timestamp)) / 3600000;
        if (diff < 12.0) {
          const moodMap = { 'rough': 1, 'low': 2, 'okay': 3, 'good': 4, 'great': 5 };
          return moodMap[parsed.mood] || 3;
        }
      } catch (_) {}
    }
    return 3;
  });

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodStep, setMoodStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [moodContext, setMoodContext] = useState('');
  const [activeMoodTier, setActiveMoodTier] = useState(null);
  const username = state.username || 'Friend';

  useEffect(() => {
    async function loadData() {
      try {
        const [journalData, taskData, stateData] = await Promise.all([
          getJournals(),
          getTasks(),
          getUserState()
        ]);
        setJournals(journalData);
        setTasks(taskData);
        if (stateData) {
          dispatch({
            type: 'SYNC_USER_STATE',
            payload: {
              aspects: stateData.aspects || [],
              completedOnboarding: !!stateData.completedOnboarding,
              memory: stateData.memory || {},
              mood: stateData.mood || null,
            },
          });
          
          if (stateData.mood && stateData.mood.timestamp) {
            const diff = (new Date() - new Date(stateData.mood.timestamp)) / 3600000;
            if (diff < 12.0) {
              setMood(stateData.mood.mood || stateData.mood.value || 'okay');
              setMoodLog(stateData.mood);
              const moodMap = { 'rough': 1, 'low': 2, 'okay': 3, 'good': 4, 'great': 5 };
              setPleasantness(moodMap[stateData.mood.mood || stateData.mood.value] || 3);
            } else {
              setMood('okay');
              setMoodLog(null);
              setPleasantness(3);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }
    loadData();
  }, [dispatch]);

  const getLast7Days = () => {
    const days = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        name: daysOfWeek[d.getDay()],
        dateNum: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        isToday: i === 0,
      });
    }
    return days;
  };

  const hasJournalOnDay = (dateStr) => {
    return journals.some(entry => {
      if (!entry.timestamp) return false;
      return entry.timestamp.startsWith(dateStr);
    });
  };

  const handleToggleTask = async (taskId) => {
    try {
      await toggleTaskCompletion(taskId);
      const taskData = await getTasks();
      setTasks(taskData);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const moods = [
    { emoji: '😢', label: 'rough', value: 'rough', color: 'text-rose-500 bg-rose-50 border-rose-200/50' },
    { emoji: '😔', label: 'low', value: 'low', color: 'text-amber-500 bg-amber-50 border-amber-200/50' },
    { emoji: '😐', label: 'okay', value: 'okay', color: 'text-slate-500 bg-slate-50 border-slate-200/50' },
    { emoji: '🙂', label: 'good', value: 'good', color: 'text-indigo-500 bg-indigo-50 border-indigo-200/50' },
    { emoji: '😁', label: 'great', value: 'great', color: 'text-emerald-500 bg-emerald-50 border-emerald-200/50' },
  ];


  // Find lowest aspect
  const getLowestAspect = () => {
    if (!aspects || aspects.length === 0) return null;
    return [...aspects].sort((a, b) => (a.score || 0) - (b.score || 0))[0];
  };

  const lowestAspect = getLowestAspect();

  const getAspectNudge = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('health') || lowerName.includes('fitness')) {
      return "Prioritize your physical well-being. Block out 15 minutes for a stretch or walk.";
    }
    if (lowerName.includes('career') || lowerName.includes('work')) {
      return "Keep your long-term vision in sight. Define the single most important task for your growth today.";
    }
    if (lowerName.includes('money') || lowerName.includes('finance') || lowerName.includes('wealth')) {
      return "Track your expenditures or review your budget milestone today.";
    }
    if (lowerName.includes('relation') || lowerName.includes('family') || lowerName.includes('friend')) {
      return "Nurture your connections. Send a quick appreciation text to someone close to you.";
    }
    if (lowerName.includes('growth') || lowerName.includes('learn')) {
      return "Feed your curiosity. Spend 10 minutes reading or learning something new.";
    }
    if (lowerName.includes('spirit')) {
      return "Align with your core values. Try a 5-minute silent mindfulness or breathing exercise.";
    }
    if (lowerName.includes('fun') || lowerName.includes('recreat')) {
      return "Recharge your battery. Dedicate 20 minutes to a hobby you love without guilt.";
    }
    if (lowerName.includes('env') || lowerName.includes('home')) {
      return "Clear your surroundings. Tidying one physical space can bring immense mental clarity.";
    }
    return "Reflect on how to balance this area in your journal today.";
  };

  const activeTasks = tasks.filter(t => !t.completed).slice(0, 3);

  const getHighestAspect = () => {
    if (!aspects || aspects.length === 0) return null;
    return [...aspects].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  };

  const highestAspect = getHighestAspect();

  const currentMoodTier = activeMoodTier || mood || 'okay';
  const moodTheme = getMoodTheme(currentMoodTier);

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/80 via-purple-50/90 to-rose-100/80 py-8 px-4 flex items-start justify-center overflow-hidden">
      
      {/* Ambient background blobs (higher opacity, tighter blur, optimized for 430px mobile ratio) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/35 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/25 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/30 rounded-full blur-2xl" />
      </div>

      <div className="max-w-2xl w-full mx-auto mt-4 relative z-10 pb-24">
        
        {/* Profile Header & Mood Selector */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-black text-primary leading-none">Hello, {username}</h1>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">
                  Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Balance: {getAverageScore()}/10
            </div>
          </div>

          {/* Mood Check-In Slider Panel */}
          <div className={`mt-5 backdrop-blur-sm rounded-2xl p-4.5 ring-1 flex gap-4 items-center transition-all duration-300 ${moodTheme.bg} ${moodTheme.border} ${moodTheme.ring} ${moodTheme.shadow}`}>
            <div className="shrink-0 flex items-center justify-center bg-white/60 backdrop-blur-xs p-2 rounded-2xl border border-white/40 shadow-sm">
              <MoodBloom mood={currentMoodTier} size={52} />
            </div>
            
            <div className="flex-1">
              <MoodSlider 
                initialPleasantness={pleasantness} 
                onChange={(mood, val) => {
                  setPleasantness(val);
                  setActiveMoodTier(mood);
                  if (moodLog && moodLog.mood === mood) {
                    setSelectedTags(moodLog.tags || []);
                  } else {
                    setSelectedTags([]);
                  }
                  setShowMoodModal(true);
                }} 
              />
            </div>
          </div>

          {/* Logged Tags list below check-in row if any exist */}
          {moodLog && moodLog.mood === mood && moodLog.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center bg-white/30 border border-white/20 rounded-xl p-2 justify-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-1">Specifics:</span>
              {moodLog.tags.map(t => (
                <span key={t} className="bg-white/60 text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-gray-200/20">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Top Aspect Card (Encouraging Highlight) */}
        {highestAspect && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-100/90 border border-amber-200/50 rounded-3xl p-5 relative overflow-hidden shadow-sm mb-6 flex flex-col justify-between ring-1 ring-white/60">
            <div className="max-w-[80%] z-10">
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-none bg-amber-100/60 border border-amber-200/40 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                <Star className="w-3 h-3" /> Top Area
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-3 leading-tight flex items-baseline gap-2">
                {highestAspect.name}
                <span className="text-xs font-black text-amber-700 bg-white px-1.5 py-0.5 rounded-md border border-amber-100 shadow-sm">
                  {highestAspect.score}/10
                </span>
              </h2>
              <p className="text-xs text-slate-700 mt-2 font-semibold leading-relaxed">
                You are excelling in this aspect. Keep maintaining this momentum and leverage this strength to balance other areas!
              </p>
            </div>
            {/* Decorative Icon */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-tr from-amber-300/30 to-orange-300/30 rounded-full blur-md pointer-events-none" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/70 rounded-full shadow-inner pointer-events-none flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        )}

        {/* Swipable Focus Cards Carousel */}
        {aspects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">
              Focus Areas
            </h3>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {aspects.map((aspect) => (
                <div 
                  key={aspect.name}
                  className="flex-shrink-0 w-[290px] snap-center bg-gradient-to-br from-indigo-50/90 to-violet-50/90 border border-indigo-200/40 rounded-3xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between ring-1 ring-white/60"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none bg-indigo-50 border border-indigo-200/30 px-2 py-0.5 rounded-full">
                        Aspect
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded-md border border-indigo-100 shadow-xs">
                        {aspect.score || 5}/10
                      </span>
                    </div>
                    
                    <h4 className="text-base font-black text-slate-800 mt-2.5 leading-tight">
                      {aspect.name}
                    </h4>
                    
                    {aspect.vision && (
                      <p className="text-[10px] italic text-slate-500 mt-1 line-clamp-1 font-medium">
                        "{aspect.vision}"
                      </p>
                    )}

                    <p className="text-xs text-slate-700 mt-2.5 font-semibold leading-relaxed line-clamp-3">
                      {aspect.focus || getAspectNudge(aspect.name)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to="/journal"
                      state={{ selectedAspect: aspect.name }}
                      className="px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-[10px] hover:bg-slate-800 transition-all flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-gold" />
                      Reflect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streak Tracker Strip ("Your Week") */}
        <div className="mb-8">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">
            Your Week
          </h3>
          <div className="flex justify-between items-center gap-1">
            {getLast7Days().map((day) => {
              const active = day.isToday;
              const journaled = hasJournalOnDay(day.dateStr);
              return (
                <div
                  key={day.dateStr}
                  className={`w-[48px] py-2.5 flex flex-col items-center justify-center rounded-2xl border text-center transition-all relative ${
                    active
                      ? 'bg-primary text-white border-primary shadow-md font-bold'
                      : 'bg-white/50 backdrop-blur-sm text-gray-600 border-gray-200/50 ring-1 ring-white/60'
                  }`}
                >
                  {journaled && (
                    <span className="absolute -top-1 w-2.5 h-2.5 bg-gold rounded-full border-2 border-white shadow-sm" />
                  )}
                  <span className="text-[10px] uppercase tracking-tighter opacity-80">{day.name}</span>
                  <span className="text-sm font-black mt-0.5">{day.dateNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wheel of Life Card (Full Width) */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-gray-100/50 flex flex-col justify-between ring-1 ring-white/60 mb-6">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
              Balance Wheel
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <WheelVisualization aspects={aspects} hideCenterText={false} className="w-full max-w-[340px]" username={username} />
          </div>
          <div className="mt-3 text-center">
            <Link to="/wheel" className="text-[10px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-wider flex items-center justify-center gap-1">
              <Disc className="w-3 h-3" />
              Expand Wheel
            </Link>
          </div>
        </div>

        {/* Stacked Widgets Below the Wheel (Goals & Advice) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch mb-6">
          
          {/* Goals Section */}
          <div className="flex flex-col justify-between bg-white/80 backdrop-blur-md rounded-3xl shadow-md p-5 border border-gray-100/50 ring-1 ring-white/60">
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1">
                <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                Action Goals
              </h3>
              <div className="space-y-3">
                {state.memory?.goals && state.memory.goals.length > 0 ? (
                  state.memory.goals.slice(0, 3).map((goal, idx) => (
                    <div key={idx} className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 flex items-start gap-3 hover:scale-[1.01] transition-transform">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Target className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 leading-relaxed">
                        {goal}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50/30 rounded-2xl border border-gray-100/30 p-6 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">No Goals Set</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Riley will extract goals from your calls.</p>
                  </div>
                )}
              </div>
            </div>
            {state.memory?.goals && state.memory.goals.length > 0 && (
              <div className="mt-4 text-center">
                <Link to="/tasks" className="text-[9px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-wider block bg-slate-50/70 border border-gray-200/20 py-2.5 rounded-xl shadow-xs">
                  All Goals
                </Link>
              </div>
            )}
          </div>

          {/* Coach Advice Section */}
          <div className="flex flex-col justify-between bg-white/80 backdrop-blur-md rounded-3xl shadow-md p-5 border border-gray-100/50 ring-1 ring-white/60">
            <div>
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                Coach Advice
              </h3>
              <div className="space-y-3">
                {state.memory?.coach_advice && state.memory.coach_advice.length > 0 ? (
                  state.memory.coach_advice.slice(0, 3).map((advice, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-rose-50/90 to-pink-50/90 rounded-2xl shadow-sm p-3.5 border border-rose-100/40 flex items-start gap-3 hover:scale-[1.01] transition-transform">
                      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-3 h-3 text-pink-600" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">
                        {advice}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50/30 rounded-2xl border border-gray-100/30 p-6 text-center">
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      Your Riley aspect advice will populate here to guide your habits.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {state.memory?.coach_advice && state.memory.coach_advice.length > 0 && (
              <div className="mt-4 text-center">
                <Link to="/coach" className="text-[9px] font-black text-rose-600 hover:opacity-80 transition-opacity uppercase tracking-wider block bg-rose-50/55 border border-rose-100/30 py-2.5 rounded-xl shadow-xs">
                  Chat Now
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Reflections & History Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Journal History Card (7 Columns) */}
          <div className="col-span-1 md:col-span-7 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-gray-100/50 flex flex-col justify-between ring-1 ring-white/60">
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">
                Reflection History
              </h3>
              <div className="space-y-3">
                {journals.length > 0 ? (
                  [...journals].reverse().slice(0, 3).map((entry) => (
                    <div key={entry.id} className="p-3 bg-slate-50/60 border border-slate-100 rounded-2xl flex flex-col gap-1 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          {entry.title || 'Untitled Entry'}
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 border border-indigo-100/40 px-2 py-0.5 rounded-full">
                            {entry.mapped_aspects?.[0] || 'Reflection'}
                          </span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    No reflections logged yet. Click 'Reflect' to start your first entry!
                  </p>
                )}
              </div>
            </div>
            {journals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100/60 text-center">
                <Link to="/journal" className="text-[9px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-wider">
                  Write New Entry
                </Link>
              </div>
            )}
          </div>

          {/* Highlights & Trends Card (5 Columns) */}
          <div className="col-span-1 md:col-span-5 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-gray-100/50 flex flex-col justify-between ring-1 ring-white/60">
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">
                Reflections Highlight
              </h3>
              
              {journals.length > 0 ? (
                <div className="space-y-4">
                  {/* Top Reflected Aspect */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-inner">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider leading-none">Most Reflected</p>
                      <p className="text-xs font-black text-slate-700 mt-1">
                        {(() => {
                          const counts = {};
                          journals.forEach(j => {
                            (j.mapped_aspects || []).forEach(a => {
                              counts[a] = (counts[a] || 0) + 1;
                            });
                          });
                          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                          return sorted[0]?.[0] || 'None yet';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Total Reflections */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50 shadow-inner">
                      <Flame className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider leading-none">Total Reflections</p>
                      <p className="text-xs font-black text-slate-700 mt-1">
                        {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                  </div>

                  {/* Highlights Bullet realized from Journals */}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Key Realization</p>
                    <p className="text-[10px] font-semibold text-slate-600 leading-relaxed italic line-clamp-2">
                      "{journals[journals.length - 1]?.content.slice(0, 80)}..."
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Empty Analytics</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">Write entries to unlock stats.</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100/60 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                Reflections are private
              </span>
            </div>
          </div>
          
        </div>

      </div>

      <EmotionSelectorSheet
        isOpen={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        initialMood={activeMoodTier}
        initialTags={selectedTags}
        onSave={async ({ mood: savedMood, tags: savedTags, impacts: savedImpacts, context: savedContext }) => {
          const log = {
            mood: savedMood,
            tags: savedTags,
            impacts: savedImpacts,
            context: savedContext,
            timestamp: new Date().toISOString(),
          };
          setMoodLog(log);
          localStorage.setItem('user_mood_log', JSON.stringify(log));
          setMood(savedMood);
          localStorage.setItem('user_mood', savedMood);
          setShowMoodModal(false);

          try {
            await updateUserState({
              vision: state.vision,
              completedOnboarding: state.completedOnboarding,
              aspects: state.aspects,
              memory: state.memory,
              mood: log
            });
            dispatch({
              type: 'SYNC_USER_STATE',
              payload: {
                ...state,
                mood: log
              }
            });
          } catch (err) {
            console.error("Failed to persist mood to DB state:", err);
          }
        }}
      />

    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WheelVisualization from '../components/ui/WheelVisualization.js';
import { useWheel } from '../hooks/useWheel.js';
import { getJournals, getTasks, toggleTaskCompletion } from '../utils/api.js';
import { useUser } from '../contexts/UserContext.js';
import { BookOpen, MessageSquare, Disc, ClipboardCheck, CheckCircle2, Circle, Trophy } from 'lucide-react';
import EmotionSelectorSheet from '../components/ui/EmotionSelectorSheet.js';

export default function Dashboard() {
  const { aspects, getAverageScore } = useWheel();
  const { state } = useUser();
  const [journals, setJournals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [mood, setMood] = useState(() => localStorage.getItem('user_mood') || 'okay');
  const [moodLog, setMoodLog] = useState(() => {
    const logged = localStorage.getItem('user_mood_log');
    return logged ? JSON.parse(logged) : null;
  });
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodStep, setMoodStep] = useState(1);
  const [pleasantness, setPleasantness] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [moodContext, setMoodContext] = useState('');
  const [activeMoodTier, setActiveMoodTier] = useState(null);
  const username = state.username || 'Friend';

  useEffect(() => {
    async function loadData() {
      try {
        const [journalData, taskData] = await Promise.all([
          getJournals(),
          getTasks()
        ]);
        setJournals(journalData);
        setTasks(taskData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/80 via-purple-50/90 to-rose-100/80 py-8 px-4 flex items-start justify-center overflow-hidden">
      
      {/* Ambient background blobs (higher opacity, tighter blur, optimized for 430px mobile ratio) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/35 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/25 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/30 rounded-full blur-2xl" />
      </div>

      <div className="max-w-2xl w-full mx-auto mt-4 relative z-10">
        
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

          {/* Mood Check-In Widget */}
          <div className="flex gap-2 justify-between mt-5 bg-white/40 backdrop-blur-sm border border-gray-200/30 rounded-2xl p-2.5 ring-1 ring-white/60">
            {moods.map((m) => {
              const active = mood === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => {
                    setActiveMoodTier(m.value);
                    if (moodLog && moodLog.mood === m.value) {
                      setSelectedTags(moodLog.tags || []);
                    } else {
                      setSelectedTags([]);
                    }
                    setShowMoodModal(true);
                  }}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all ${
                    active 
                      ? `${m.color} scale-105 shadow-sm font-bold border` 
                      : 'hover:bg-white/50 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-[9px] uppercase font-black tracking-tighter mt-0.5">{m.label}</span>
                </button>
              );
            })}
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

        {/* Dynamic Focus Card */}
        {lowestAspect && (
          <div className="bg-gradient-to-br from-indigo-100/90 to-violet-100/90 border border-indigo-200/50 rounded-3xl p-6 relative overflow-hidden shadow-sm mb-6 flex flex-col justify-between ring-1 ring-white/60">
            <div className="max-w-[75%] z-10">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none bg-indigo-50 border border-indigo-200/40 px-2.5 py-1 rounded-full">
                Focus Area
              </span>
              <h2 className="text-xl font-black text-slate-800 mt-3 leading-tight flex items-baseline gap-2">
                {lowestAspect.name}
                <span className="text-xs font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded-md border border-indigo-100 shadow-sm">
                  {lowestAspect.score}/10
                </span>
              </h2>
              {lowestAspect.vision && (
                <p className="text-[11px] italic text-slate-500 mt-1 font-medium line-clamp-2">
                  "{lowestAspect.vision}"
                </p>
              )}
              <p className="text-xs text-slate-700 mt-3 font-semibold leading-relaxed">
                {getAspectNudge(lowestAspect.name)}
              </p>
            </div>
            
            <div className="mt-5 flex items-center justify-between z-10">
              <Link
                to="/journal"
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Reflect on this
              </Link>
            </div>

            {/* Decorative abstract elements simulating 3D clay aesthetic */}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-tr from-indigo-300/40 to-violet-400/40 rounded-full blur-md pointer-events-none" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-gold/30 to-amber-400/30 rounded-2xl rotate-12 shadow-inner pointer-events-none flex items-center justify-center">
              <Trophy className="w-6 h-6 text-indigo-600/70 animate-bounce" />
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

        {/* Asymmetric 2-Column Section: Left (Wheel) and Right (Tasks & Coach Tip) */}
        <div className="grid grid-cols-12 gap-4 items-stretch">
          
          {/* Wheel of Life Card (7 Columns) */}
          <div className="col-span-7 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-4 border border-gray-100/50 flex flex-col justify-between ring-1 ring-white/60">
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                Balance Wheel
              </h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <WheelVisualization aspects={aspects} hideCenterText={false} className="w-full scale-105" />
            </div>
            <div className="mt-3 text-center">
              <Link to="/wheel" className="text-[10px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-wider flex items-center justify-center gap-1">
                <Disc className="w-3 h-3" />
                Expand Wheel
              </Link>
            </div>
          </div>

          {/* Right Column Stacked Widgets (5 Columns) */}
          <div className="col-span-5 flex flex-col gap-4 justify-between">
            
            {/* Active Goals Widget */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-4 border border-gray-100/50 flex-1 flex flex-col justify-between ring-1 ring-white/60">
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                  Goals
                </h3>
                <div className="space-y-2">
                  {activeTasks.length > 0 ? (
                    activeTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleToggleTask(t.id)}
                        className="w-full flex items-start gap-1.5 text-left group"
                      >
                        <Circle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                        <span className="text-[11px] font-medium text-slate-700 leading-tight line-clamp-2">
                          {t.title}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">All Done</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">No pending tasks.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Link to="/tasks" className="text-[9px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-wider block text-center">
                  All Goals
                </Link>
              </div>
            </div>

            {/* Coach Insight Snippet */}
            <div className="bg-gradient-to-br from-rose-50/90 to-pink-50/90 rounded-3xl shadow-xl p-4 border border-rose-100/50 flex-1 flex flex-col justify-between ring-1 ring-white/60">
              <div>
                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Coach Tip
                </h3>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium line-clamp-4">
                  {lowestAspect 
                    ? `Your ${lowestAspect.name} aspect needs attention today. Try speaking to the coach about your vision to form a micro-habit.`
                    : "Speak with your coach regularly to extract actionable goals and balance your life segments."
                  }
                </p>
              </div>
              <div className="mt-2">
                <Link to="/coach" className="text-[9px] font-black text-rose-600 hover:opacity-80 transition-opacity uppercase tracking-wider block text-center">
                  Chat Now
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      <EmotionSelectorSheet
        isOpen={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        initialMood={activeMoodTier}
        initialTags={selectedTags}
        onSave={({ mood: savedMood, tags: savedTags, impacts: savedImpacts, context: savedContext }) => {
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
        }}
      />

    </div>
  );
}

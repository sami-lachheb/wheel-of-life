import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import MoodBloom, { getMoodTheme, PALETTES } from './MoodBloom.js';

const emotionMap = {
  rough: ['Lonely', 'Overwhelmed', 'Angry', 'Sad', 'Drained', 'Anxious', 'Frustrated', 'Hopeless', 'Hurt', 'Guilty', 'Jealous', 'Scared', 'Stressed', 'Worried'],
  low: ['Tired', 'Bored', 'Unmotivated', 'Muted', 'Restless', 'Insecure', 'Disappointed', 'Quiet', 'Apathetic', 'Slow'],
  okay: ['Neutral', 'Calm', 'Relaxed', 'Focused', 'Content', 'Indifferent', 'Peaceful', 'Quiet', 'Comfortable', 'Steady'],
  good: ['Happy', 'Grateful', 'Optimistic', 'Loved', 'Inspired', 'Social', 'Creative', 'Proud', 'Cheerful', 'Warm'],
  great: ['Excited', 'Ecstatic', 'Proud', 'Energized', 'Inspired', 'Hopeful', 'Grateful', 'Thrilled', 'Elated', 'Joyful'],
};

const impactAspects = ['Community', 'Current Events', 'Dating', 'Education', 'Family', 'Fitness', 'Friends', 'Health', 'Hobbies', 'Identity', 'Money', 'Partner', 'Self-care', 'Spirituality', 'Tasks', 'Travel', 'Work'];

const mapMoodToLevel = (mood) => {
  switch (mood) {
    case 'rough': return 1;
    case 'low': return 2;
    case 'okay': return 3;
    case 'good': return 4;
    case 'great': return 5;
    default: return 3;
  }
};

const mapLevelToMood = (level) => {
  switch (level) {
    case 1: return 'rough';
    case 2: return 'low';
    case 3: return 'okay';
    case 4: return 'good';
    case 5: return 'great';
    default: return 'okay';
  }
};

const getPleasantnessLabel = (level) => {
  switch (level) {
    case 1: return 'Very Unpleasant';
    case 2: return 'Slightly Unpleasant';
    case 3: return 'Neutral';
    case 4: return 'Slightly Pleasant';
    case 5: return 'Very Pleasant';
    default: return 'Neutral';
  }
};

const findLevelForTag = (tag) => {
  if (!tag) return 3;
  const tagLower = tag.toLowerCase();
  for (const [moodKey, list] of Object.entries(emotionMap)) {
    if (list.some(item => item.toLowerCase() === tagLower)) {
      return mapMoodToLevel(moodKey);
    }
  }
  return 3;
};

export default function EmotionSelectorSheet({ isOpen, onClose, onSave, initialMood = null, initialTags = [] }) {
  const [step, setStep] = useState(1);
  const [pleasantness, setPleasantness] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [contextText, setContextText] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  // Sync state with props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTags && initialTags.length > 0) {
        setStep(2);
        const tag = initialTags[0];
        const level = findLevelForTag(tag);
        setPleasantness(level);
      } else {
        setStep(1);
        const level = mapMoodToLevel(initialMood);
        setPleasantness(level);
      }
      setSelectedTags(initialTags || []);
      setSelectedImpacts([]);
      setContextText('');
      setShowAllTags(false);
    }
  }, [isOpen, initialMood, initialTags]);

  if (!isOpen) return null;

  const currentMoodKey = mapLevelToMood(pleasantness);
  const moodColors = PALETTES[currentMoodKey] || PALETTES.okay;
  const theme = getMoodTheme(currentMoodKey);
  const descriptorPool = emotionMap[currentMoodKey] || [];
  const visibleDescriptors = showAllTags ? descriptorPool : descriptorPool.slice(0, 10);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleImpact = (factor) => {
    setSelectedImpacts(prev =>
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    );
  };

  const handleDone = () => {
    onSave({
      mood: currentMoodKey,
      tags: selectedTags,
      impacts: selectedImpacts,
      context: contextText
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 max-w-[430px] mx-auto animate-fade-in overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
      {/* Mood gradient overlay — sits above white, below content */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ background: `linear-gradient(to bottom, ${moodColors.primary}30, ${moodColors.secondary}18 70%, transparent)` }}
      />
      
      {/* Header */}
      <div className="flex justify-between items-center z-10 w-full">
        {step > 1 ? (
          <button
            onClick={() => setStep(prev => prev - 1)}
            className="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <button
            onClick={onClose}
            className="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}

        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {step > 1 ? "Log State of Mind" : ""}
        </h2>

        <button
          onClick={onClose}
          className="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
        >
          Cancel
        </button>
      </div>

      {/* STEP 1: General Emotion Pleasantness Slider */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center py-6 z-10">
          <h3 className="text-xl font-black text-center text-slate-800 mb-2 leading-tight">
            Choose how you're feeling right now
          </h3>
          
          {/* MoodBloom Geometric Shape with Ambient Glow */}
          <div className="relative w-56 h-56 flex items-center justify-center mx-auto my-12 transition-all duration-500">
            {/* Outer ambient glow blob */}
            <div
              className="absolute w-72 h-72 rounded-full blur-[80px] transition-all duration-1000 animate-pulse"
              style={{ backgroundColor: moodColors.glow }}
            />
            {/* Inner tighter glow blob */}
            <div
              className="absolute w-48 h-48 rounded-full blur-[50px] transition-all duration-700"
              style={{ backgroundColor: `${moodColors.primary}25` }}
            />
            <div className="relative z-10">
              <MoodBloom mood={currentMoodKey} size={180} />
            </div>
          </div>

          <div className="w-full text-center mb-8">
            <h4 className="text-2xl font-black text-slate-800 transition-all duration-300">
              {getPleasantnessLabel(pleasantness)}
            </h4>
          </div>

          <div className="w-full px-4 mb-4">
            <input
              type="range"
              min="1"
              max="5"
              value={pleasantness}
              onChange={(e) => setPleasantness(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Very Unpleasant</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Very Pleasant</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-md mt-6"
          >
            Next
          </button>
        </div>
      )}

      {/* STEP 2: Emotion Vocabulary Descriptors */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-start py-6 z-10">
          <div className="text-center mb-4">
            {/* Small MoodBloom indicator with mini glow */}
            <div className="relative inline-flex items-center justify-center">
              <div
                className="absolute w-20 h-20 rounded-full blur-[25px] transition-all duration-700"
                style={{ backgroundColor: moodColors.glow }}
              />
              <div className="relative z-10">
                <MoodBloom mood={currentMoodKey} size={48} />
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 leading-none mb-4 mt-3">
              {getPleasantnessLabel(pleasantness)}
            </h3>
            
            <p className="text-xs font-bold text-slate-700">What best describes this feeling?</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white/40 backdrop-blur-sm border border-gray-200/30 rounded-3xl p-4 ring-1 ring-white/60 mb-4 max-h-[300px] overflow-y-auto">
              <div className="flex flex-wrap gap-2 justify-center py-1">
                {visibleDescriptors.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all border ${
                        selected
                          ? 'bg-primary text-white border-primary scale-105 shadow-sm font-black'
                          : 'bg-white text-slate-600 border-gray-200/40 hover:bg-slate-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {descriptorPool.length > 10 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-[10px] font-black text-primary hover:opacity-85 transition-opacity uppercase tracking-wider block mx-auto mt-4 text-center"
                >
                  {showAllTags ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-md"
            >
              Next
            </button>
            <button
              onClick={() => {
                setSelectedTags([]);
                setStep(3);
              }}
              className="w-full py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider text-center"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Context & Aspect Impacts */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-start py-6 z-10">
          <div className="text-center mb-4">
            {/* Small MoodBloom indicator with mini glow */}
            <div className="relative inline-flex items-center justify-center">
              <div
                className="absolute w-20 h-20 rounded-full blur-[25px] transition-all duration-700"
                style={{ backgroundColor: moodColors.glow }}
              />
              <div className="relative z-10">
                <MoodBloom mood={currentMoodKey} size={48} />
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 leading-none mb-4 mt-3">
              {getPleasantnessLabel(pleasantness)}
            </h3>
            
            <p className="text-xs font-bold text-slate-700">What's having the biggest impact on you?</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="bg-white/40 backdrop-blur-sm border border-gray-200/30 rounded-3xl p-4 ring-1 ring-white/60 max-h-[220px] overflow-y-auto">
              <div className="flex flex-wrap gap-2 justify-center py-1">
                {impactAspects.map((factor) => {
                  const selected = selectedImpacts.includes(factor);
                  return (
                    <button
                      key={factor}
                      onClick={() => toggleImpact(factor)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all border ${
                        selected
                          ? 'bg-primary text-white border-primary scale-105 shadow-sm font-black'
                          : 'bg-white text-slate-600 border-gray-200/40 hover:bg-slate-50'
                      }`}
                    >
                      {factor}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Additional Context..."
                rows={3}
                className="w-full p-4 text-xs bg-white/80 border border-gray-200/40 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-medium text-slate-700 placeholder-slate-400 ring-1 ring-white/60"
              />
            </div>
          </div>

          <button
            onClick={handleDone}
            className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-md mt-6"
          >
            Done
          </button>
        </div>
      )}

    </div>
  );
}

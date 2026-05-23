import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Send, Keyboard, X, ChevronDown, Pause, Play, ListTodo } from 'lucide-react';
import { useUser } from '../contexts/UserContext.js';

export default function Coach() {
  const navigate = useNavigate();
  const { state } = useUser();
  
  // Interactive States
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [currentSubtitles, setCurrentSubtitles] = useState('');
  const [showTasksDrawer, setShowTasksDrawer] = useState(false);
  
  // Speech Recognition Instances
  const [recognition, setRecognition] = useState(null);

  const [tasks, setTasks] = useState([
    {
      id: '1',
      name: 'Practice gratitude',
      description: 'Write down 3 things you are grateful for today',
      priority: 'medium',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aspect: 'Personal Growth',
      completed: false,
    }
  ]);

  // Initial greeting playback trigger
  useEffect(() => {
    const greetingText = "Hi Sami, welcome back. How are you feeling about your life aspects today? Let's check in.";
    const timer = setTimeout(() => {
      triggerTTS(greetingText);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeSpeech = finalTranscript || interimTranscript;
      if (activeSpeech.trim()) {
        setCurrentSubtitles(`Sami: "${activeSpeech}"`);
      }

      // Once final sentence is captured, submit to AI
      if (finalTranscript.trim()) {
        sendUserVoiceInput(finalTranscript);
      }
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error', event.error);
    };

    setRecognition(rec);
  }, []);

  // Control speech recognition listening loop
  useEffect(() => {
    if (!recognition) return;

    if (!isMuted && !isSpeaking && !isHeld) {
      try {
        recognition.start();
      } catch (e) {
        // Already active
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }, [isMuted, isSpeaking, isHeld, recognition]);

  const triggerTTS = (text) => {
    if (!text || isMuted || isHeld) return;
    
    window.speechSynthesis.cancel();
    setCurrentSubtitles(text);
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSubtitles('');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSubtitles('');
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const sendUserVoiceInput = (text) => {
    if (!text.trim()) return;

    // Temporarily pause recognition to process
    if (recognition) {
      try { recognition.stop(); } catch(e){}
    }

    setTimeout(() => {
      const responses = [
        "That sounds like a meaningful insight. Let's make sure we block out 15 minutes of quiet time to support this aspect.",
        "I hear you. Balancing Work and Health is always a dance. Let's focus on setting a firm boundary on log-off times.",
        "Outstanding progress. Let's reinforce this momentum by noting one win in your journal tonight."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      triggerTTS(randomResponse);

      if (Math.random() > 0.4) {
        const newExtractedTask = {
          id: Date.now().toString(),
          name: 'Set firm work boundary',
          description: 'Log off from work precisely at 6 PM to prioritize family time.',
          priority: 'high',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          aspect: 'Career & Work',
          completed: false,
        };
        setTasks(prev => [...prev, newExtractedTask]);
      }
    }, 1200);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();
    setMessageText('');
    setShowTextInput(false);
    
    // Display user message inside bubble
    setCurrentSubtitles(`Sami: "${userMessage}"`);

    if (isHeld) {
      window.speechSynthesis.resume();
      setIsHeld(false);
    }
    
    setTimeout(() => {
      const responses = [
        "That sounds like a meaningful insight. Let's make sure we block out 15 minutes of quiet time to support this aspect.",
        "I hear you. Balancing Work and Health is always a dance. Let's focus on setting a firm boundary on log-off times.",
        "Outstanding progress. Let's reinforce this momentum by noting one win in your journal tonight."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      triggerTTS(randomResponse);

      if (Math.random() > 0.4) {
        const newExtractedTask = {
          id: Date.now().toString(),
          name: 'Set firm work boundary',
          description: 'Log off from work precisely at 6 PM to prioritize family time.',
          priority: 'high',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          aspect: 'Career & Work',
          completed: false,
        };
        setTasks(prev => [...prev, newExtractedTask]);
      }
    }, 1400);
  };

  const toggleMute = () => {
    const nextMutedState = !isMuted;
    setIsMuted(nextMutedState);
    if (nextMutedState) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSubtitles('');
    } else {
      triggerTTS("Audio unmuted.");
    }
  };

  const toggleHold = () => {
    if (isHeld) {
      window.speechSynthesis.resume();
      if (currentSubtitles) {
        setIsSpeaking(true);
      }
      setIsHeld(false);
    } else {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsHeld(true);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black flex flex-col justify-between p-6 max-w-[430px] mx-auto overflow-hidden text-white font-sans select-none">
      
      {/* 1. Header Bar */}
      <div className="z-10 flex items-center justify-between w-full">
        <button 
          onClick={() => {
            window.speechSynthesis.cancel();
            navigate(-1);
          }} 
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTasksDrawer(true)}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all relative"
          >
            <ListTodo className="w-4 h-4" />
            {tasks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black">
                {tasks.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isHeld ? 'bg-amber-400' : isSpeaking ? 'bg-indigo-400 animate-ping' : 'bg-white/30'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {isHeld ? 'On Hold' : 'Hayat'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Central Fluid Morphing Blob */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full my-4">
        
        {/* Glow Effect behind the blob */}
        <div className={`absolute w-[280px] h-[280px] rounded-full bg-indigo-500/20 blur-[80px] transition-all duration-1000 ${
          isSpeaking ? 'scale-125 opacity-100' : 'scale-100 opacity-60'
        }`} />

        {/* Morphing Blob */}
        <div 
          className={`w-[290px] h-[290px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-fuchsia-500 shadow-[0_0_60px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center p-8 text-center transition-all duration-700 transform ${
            isSpeaking ? 'scale-105 animate-morph-speaking' : 'scale-100 animate-morph'
          } ${isHeld ? 'opacity-40 saturate-50' : 'opacity-100'}`}
        >
          {isHeld ? (
            /* Hold Overlay View */
            <div className="animate-fade-in flex flex-col items-center">
              <Play className="w-8 h-8 text-white/80 animate-pulse mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Session Paused</span>
            </div>
          ) : currentSubtitles ? (
            /* Subtitle View when Speaking / Transcribing */
            <p className="text-sm font-bold leading-relaxed tracking-tight text-white/95 max-w-[210px] animate-fade-in">
              {currentSubtitles}
            </p>
          ) : (
            /* Hayat Profile View when Idle */
            <div className="animate-fade-in flex flex-col items-center">
              <h2 className="text-2xl font-medium tracking-tight text-white/90">
                Hi, I'm <span className="font-extrabold text-white">Hayat</span>
              </h2>
              <div className="mt-3 flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                <span className="text-[9px] font-bold tracking-tight text-white/80">an AI Assistant</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Session Controls Panel */}
      <div className="z-10 flex flex-col gap-4">
        
        {/* Expanded Keyboard Input Box */}
        {showTextInput && (
          <form onSubmit={handleSendMessage} className="flex gap-2 bg-white/5 border border-white/10 backdrop-blur-md p-2 rounded-2xl animate-fade-in">
            <input 
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Ask Hayat something..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder-white/30"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Specific bottom navbar: mute (X) / hold (Pause icon) / chat (with keyboard) */}
        <div className="grid grid-cols-3 gap-4 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-3xl shadow-2xl">
          
          {/* Mute Button (Displays Mic when active, X when muted) */}
          <button 
            onClick={toggleMute}
            className={`w-full py-3.5 rounded-2xl flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {isMuted ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* Hold Button (Displays Pause when active, Play when held) */}
          <button 
            onClick={toggleHold}
            className={`w-full py-3.5 rounded-2xl flex items-center justify-center transition-all ${
              isHeld ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {isHeld ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

          {/* Chat Button (Displays Keyboard) */}
          <button 
            onClick={() => setShowTextInput(!showTextInput)}
            className={`w-full py-3.5 rounded-2xl flex items-center justify-center transition-all ${
              showTextInput ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <Keyboard className="w-5 h-5" />
          </button>
          
        </div>
      </div>

      {/* 4. Extracted Tasks Drawer */}
      {showTasksDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center max-w-[430px] mx-auto">
          <div className="absolute inset-0" onClick={() => setShowTasksDrawer(false)} />
          
          <div className="w-full bg-slate-950 border-t border-white/10 rounded-t-[32px] p-6 shadow-2xl relative z-10 max-h-[80vh] flex flex-col justify-between animate-slide-up">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Session Goals</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Extracted by Hayat</p>
                </div>
                <button 
                  onClick={() => setShowTasksDrawer(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-8 font-medium">No actions extracted yet.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${
                        task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-xs font-black tracking-tight text-white">{task.name}</h4>
                        <p className="text-[10px] text-white/60 mt-1 leading-relaxed">{task.description}</p>
                        <div className="flex gap-3 mt-3 text-[8px] font-black uppercase tracking-wider text-white/40">
                          <span className="bg-white/5 px-2 py-0.5 rounded-md">Priority: {task.priority}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-md">Aspect: {task.aspect}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowTasksDrawer(false)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-colors shadow-lg mt-6"
            >
              Continue Session
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mic, Send, Keyboard, X, ChevronDown, Pause, Play, ListTodo } from 'lucide-react';
import { useUser } from '../contexts/UserContext.js';
import { useCoachLive } from '../hooks/useCoachLive.js';
import { getTasks } from '../utils/api.js';

export default function Coach() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { state } = useUser();
  const displayName = state.username || 'there';

  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [currentSubtitles, setCurrentSubtitles] = useState('');
  const [showTasksDrawer, setShowTasksDrawer] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks in Coach:", err);
      }
    }
    loadTasks();
  }, []);

  const silenceTimeoutRef = useRef(null);
  const wordQueueRef = useRef([]);
  const activeIntervalRef = useRef(null);
  const wordsProcessedRef = useRef(new Set());
  const fullTextRef = useRef('');

  const resetAssistantTurn = useCallback(() => {
    wordQueueRef.current = [];
    wordsProcessedRef.current = new Set();
    fullTextRef.current = '';
    if (activeIntervalRef.current) {
      clearInterval(activeIntervalRef.current);
      activeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
      }
    };
  }, []);

  const startTypewriterIfNeeded = useCallback(() => {
    if (activeIntervalRef.current) return;

    activeIntervalRef.current = setInterval(() => {
      if (wordQueueRef.current.length > 0) {
        const nextWord = wordQueueRef.current.shift();
        setCurrentSubtitles((prev) => {
          if (prev.startsWith(`${displayName}:`)) {
            return nextWord;
          }
          return prev ? `${prev} ${nextWord}` : nextWord;
        });
      }
    }, 320);
  }, [displayName]);

  const handleUserTranscript = useCallback(
    (text) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (text?.trim()) {
        resetAssistantTurn();
        setIsHeld(false);
        setCurrentSubtitles(`${displayName}: "${text}"`);
      }
    },
    [displayName, resetAssistantTurn]
  );

  const handleAssistantTranscript = useCallback((text) => {
    if (!text?.trim()) return;

    fullTextRef.current = text;
    const allWords = text.trim().split(/\s+/);
    
    let addedAny = false;
    allWords.forEach((word, index) => {
      const wordId = `${index}-${word}`;
      if (!wordsProcessedRef.current.has(wordId)) {
        wordsProcessedRef.current.add(wordId);
        wordQueueRef.current.push(word);
        addedAny = true;
      }
    });

    if (addedAny) {
      startTypewriterIfNeeded();
    }
  }, [startTypewriterIfNeeded]);

  const handleReady = useCallback(() => {
    setConnectionError(null);
    setNeedsAudioUnlock(false);
  }, []);

  const handleError = useCallback((message) => {
    setConnectionError(message);
  }, []);

  const handleNeedsAudioUnlock = useCallback((needed = true) => {
    setNeedsAudioUnlock(needed);
  }, []);

  const handleTurnComplete = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (showTextInput || isSpeaking) return;
    
    silenceTimeoutRef.current = setTimeout(() => {
      setIsHeld(true);
    }, 10000);
    setTimeout(() => {
      setCurrentSubtitles((prev) => {
        if (prev.startsWith(`${displayName}:`)) return prev;
        return '';
      });
    }, 2500);
  }, [displayName, showTextInput, isSpeaking]);

  useEffect(() => {
    if (showTextInput || isSpeaking) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
  }, [showTextInput, isSpeaking]);

  const { status, sendText, stopPlayback, unlockAudio } = useCoachLive({
    enabled: Boolean(state.isAuthenticated),
    isMuted,
    isHeld,
    onUserTranscript: handleUserTranscript,
    onAssistantTranscript: handleAssistantTranscript,
    onSpeakingChange: setIsSpeaking,
    onReady: handleReady,
    onError: handleError,
    onNeedsAudioUnlock: handleNeedsAudioUnlock,
    onTurnComplete: handleTurnComplete,
  });

  useEffect(() => {
    if (status === 'connected' && locationState.state?.initialMessage) {
      const initMsg = locationState.state.initialMessage;
      window.history.replaceState({}, document.title);
      resetAssistantTurn();
      sendText(initMsg);
      setCurrentSubtitles(`${displayName}: "${initMsg}"`);
    }
  }, [status, locationState, sendText, displayName, resetAssistantTurn]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();
    setMessageText('');
    setShowTextInput(false);
    resetAssistantTurn();
    setCurrentSubtitles(`${displayName}: "${userMessage}"`);
    sendText(userMessage);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      stopPlayback();
      setIsSpeaking(false);
      resetAssistantTurn();
      setCurrentSubtitles('');
    }
  };

  const toggleHold = () => {
    if (isHeld) {
      setIsHeld(false);
    } else {
      stopPlayback();
      setIsSpeaking(false);
      resetAssistantTurn();
      setIsHeld(true);
    }
  };

  const statusLabel =
    connectionError
      ? 'Offline'
      : status === 'ready'
        ? 'Riley'
        : status === 'connecting'
          ? 'Connecting'
          : 'Riley';

  const statusDotClass = connectionError
    ? 'bg-rose-500'
    : isHeld
      ? 'bg-amber-400'
      : isSpeaking
        ? 'bg-indigo-400 animate-ping'
        : status === 'ready'
          ? 'bg-emerald-400'
          : 'bg-white/30';

  return (
    <div className="relative h-screen w-full bg-black flex flex-col justify-between p-6 pb-28 max-w-[430px] mx-auto overflow-hidden text-white font-sans select-none">

      <div className="z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              stopPlayback();
              navigate(-1);
            }}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
        </div>

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
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {isHeld ? 'On Hold' : statusLabel}
            </span>
          </div>
        </div>
      </div>

      {connectionError && (
        <p className="z-10 text-center text-[10px] text-rose-400/90 px-4 -mt-2">
          {connectionError}. Check GEMINI_API_KEY and backend logs.
        </p>
      )}

      {needsAudioUnlock && (
        <button
          type="button"
          onClick={unlockAudio}
          className="z-20 mx-auto -mt-1 mb-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg"
        >
          Tap to enable Riley&apos;s voice
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative w-full my-4">
        <div
          className={`absolute w-[280px] h-[280px] rounded-full bg-indigo-500/20 blur-[80px] transition-all duration-1000 ${
            isSpeaking ? 'scale-125 opacity-100' : 'scale-100 opacity-60'
          }`}
        />

        <div
          className={`w-[290px] h-[290px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-fuchsia-500 shadow-[0_0_60px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center p-8 text-center transition-all duration-700 transform ${
            isSpeaking ? 'scale-105 animate-morph-speaking' : 'scale-100 animate-morph'
          } ${isHeld ? 'opacity-40 saturate-50' : 'opacity-100'}`}
        >
          {isHeld ? (
            <div className="animate-fade-in flex flex-col items-center">
              <Play className="w-8 h-8 text-white/80 animate-pulse mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Session Paused</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-end gap-1.5 justify-center h-12">
              <span className="w-2.5 h-6 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-2.5 h-10 bg-white rounded-full animate-bounce" />
              <span className="w-2.5 h-6 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
          ) : status === 'ready' ? (
            <div className="animate-fade-in flex flex-col items-center">
              <ChevronDown className="w-8 h-8 text-white/40 animate-bounce mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Riley Listening</span>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col items-center">
              <h2 className="text-2xl font-medium tracking-tight text-white/90">
                Hi, I'm <span className="font-extrabold text-white">Riley</span>
              </h2>
              <div className="mt-3 flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                <span className="text-[9px] font-bold tracking-tight text-white/80">an AI Assistant</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </div>
              {status === 'connecting' && (
                <p className="mt-4 text-[10px] text-white/50 uppercase tracking-widest">Connecting voice…</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Subtitle Reading Zone */}
      <div className="w-full min-h-[90px] flex items-center justify-center px-6 text-center z-10 -mt-2">
        <p className="text-sm font-semibold leading-relaxed tracking-wide text-white/85 max-w-[340px] animate-fade-in transition-all duration-300">
          {currentSubtitles || (status === 'ready' && !isHeld ? "How can I help you today?" : "")}
        </p>
      </div>

      <div className="z-10 flex flex-col gap-4">
        {showTextInput && (
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 bg-white/5 border border-white/10 backdrop-blur-md p-2 rounded-2xl animate-fade-in"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Ask Riley something..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder-white/30"
              autoFocus
            />
            <button
              type="submit"
              disabled={!messageText.trim() || status !== 'ready'}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="grid grid-cols-3 gap-4 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-3xl shadow-2xl">
          <button
            onClick={toggleMute}
            className={`w-full py-3.5 rounded-2xl flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {isMuted ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleHold}
            className={`w-full py-3.5 rounded-2xl flex items-center justify-center transition-all ${
              isHeld ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {isHeld ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

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

      {showTasksDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center max-w-[430px] mx-auto">
          <div className="absolute inset-0" onClick={() => setShowTasksDrawer(false)} />

          <div className="w-full bg-slate-950 border-t border-white/10 rounded-t-[32px] p-6 shadow-2xl relative z-10 max-h-[80vh] flex flex-col justify-between animate-slide-up">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Session Goals</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Extracted by Riley</p>
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
                    <div
                      key={task.id}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3"
                    >
                      <div
                        className={`w-2 h-2 mt-1.5 rounded-full ${
                          (task.priority || 'medium') === 'high'
                            ? 'bg-rose-500'
                            : (task.priority || 'medium') === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-black tracking-tight text-white">{task.title || task.name}</h4>
                        {(task.description || task.title) && (
                          <p className="text-[10px] text-white/60 mt-1 leading-relaxed">{task.description || "Task set from conversation"}</p>
                        )}
                        <div className="flex gap-3 mt-3 text-[8px] font-black uppercase tracking-wider text-white/40">
                          <span className="bg-white/5 px-2 py-0.5 rounded-md">Priority: {task.priority || 'medium'}</span>
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

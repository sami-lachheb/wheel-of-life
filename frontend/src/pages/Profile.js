import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { useWheel } from '../hooks/useWheel.js';
import { LogOut, User, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const { state, dispatch } = useUser();
  const { getAverageScore } = useWheel();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-indigo-100/80 via-purple-50/90 to-rose-100/80 py-8 px-4 flex items-center justify-center overflow-hidden">
      
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/35 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/25 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/30 rounded-full blur-2xl" />
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/60 relative z-10 ring-1 ring-white/60">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-slate-800 transition-colors text-xs font-black uppercase tracking-wider mb-8 bg-white/60 px-3 py-1.5 rounded-full border border-gray-200/20 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100/60">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white font-black text-2xl border-4 border-white shadow-md mb-4">
            {state.username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-black text-slate-800">{state.username}</h2>
        </div>

        {/* Stats Section */}
        <div className="py-6 space-y-5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Stats Overview</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 border border-gray-100/50 p-4 rounded-2xl text-center shadow-xs">
              <span className="block text-2xl font-black text-indigo-600">{state.aspects.length}</span>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Aspects</span>
            </div>
            
            <div className="bg-white/60 border border-gray-100/50 p-4 rounded-2xl text-center shadow-xs">
              <span className="block text-2xl font-black text-amber-600">{getAverageScore()} <span className="text-xs text-gray-400">/10</span></span>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Balance Avg</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl flex items-start gap-3 border border-emerald-100/40 shadow-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Configured</h4>
              <p className="text-[10px] text-emerald-700 mt-1 font-semibold leading-relaxed">
                Your Wheel of Life setup is synchronized and up to date.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-5 border-t border-gray-100/60">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-rose-50 text-rose-600 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 hover:text-rose-700 transition-all text-xs uppercase tracking-widest shadow-xs border border-rose-100/30"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>
        </div>
      </div>
    </div>
  );
}

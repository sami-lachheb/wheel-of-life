import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import { useWheel } from '../hooks/useWheel.js';
import { LogOut, User, Award, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const { state, dispatch } = useUser();
  const { getAverageScore } = useWheel();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-light-gray py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
          <div className="p-4 bg-primary/5 text-primary rounded-full mb-3 shadow-inner">
            <User className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-primary">{state.username}</h2>
          <span className="mt-1 px-3 py-1 bg-gold/15 text-primary font-bold text-xs rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3 text-gold-dark" />
            Personal Account
          </span>
        </div>

        {/* Stats Section */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Life Balance Stats</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-light-gray p-4 rounded-xl text-center border border-gray-50">
              <span className="block text-2xl font-black text-primary">{state.aspects.length}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Aspects Tracked</span>
            </div>
            
            <div className="bg-light-gray p-4 rounded-xl text-center border border-gray-50">
              <span className="block text-2xl font-black text-gold">{getAverageScore()} <span className="text-xs text-gray-400">/10</span></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Average Score</span>
            </div>
          </div>

          <div className="bg-green-50/50 p-4 rounded-xl flex items-start gap-3 border border-green-100/50">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-green-900">Onboarding Completed</h4>
              <p className="text-[10px] text-green-700 mt-0.5 leading-relaxed">
                Your Wheel of Life setup is synchronized and saved securely to your personal SQLite DB instance.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 hover:text-red-700 transition-all text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
}

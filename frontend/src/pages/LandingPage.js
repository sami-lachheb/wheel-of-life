import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.js';
import appLogo from '../assets/logo.png';

export default function LandingPage() {
  const { state } = useUser();

  if (state.isAuthenticated && state.completedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-indigo-100/80 via-purple-50/90 to-rose-100/80 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-400/35 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-amber-300/25 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-rose-400/30 rounded-full blur-2xl" />
      </div>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto flex items-center justify-center">
              <img src={appLogo} alt="RailWay Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            RailWay
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl font-medium">
            Track your life balance across 8 key areas
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/onboarding"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Your Journey
            </Link>
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-indigo-600 font-bold underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-gray-500">
        <p>© 2026 RailWay. Your journey to balanced living.</p>
      </footer>
    </div>
  );
}

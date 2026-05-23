import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.js';
import { useUser } from '../contexts/UserContext.js';

export default function LandingPage() {
  const { state } = useUser();

  if (state.isAuthenticated && state.completedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent scrolled={false} links={['Home', 'About']} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <div className="w-64 h-64 mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="90" fill="#6366f1" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="#f97316" strokeWidth="2" />
                <path d="M100,100 L100,10" stroke="#f97316" strokeWidth="2" />
                <path d="M100,100 L190,100" stroke="#f97316" strokeWidth="2" />
                <path d="M100,100 L100,190" stroke="#f97316" strokeWidth="2" />
                <path d="M100,100 L10,100" stroke="#f97316" strokeWidth="2" />
                <circle cx="100" cy="10" r="5" fill="#f97316" />
                <circle cx="190" cy="100" r="5" fill="#f97316" />
                <circle cx="100" cy="190" r="5" fill="#f97316" />
                <circle cx="10" cy="100" r="5" fill="#f97316" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-primary mb-4">
            Wheel of Life
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl">
            How good are you at what you're doing?
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/onboarding"
              className="px-8 py-4 bg-gold text-primary font-bold text-lg rounded-full hover:bg-gold-dark transition-colors shadow-md"
            >
              Start Your Journey
            </Link>
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:text-gold-dark font-bold underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-gray-500">
        <p>© 2026 Wheel of Life. Your journey to balanced living.</p>
      </footer>
    </div>
  );
}

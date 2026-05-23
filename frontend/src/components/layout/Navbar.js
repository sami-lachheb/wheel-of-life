import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../../contexts/UserContext.js';
import { LogOut, User, Home, BookOpen, MessageSquare, Disc, ClipboardCheck } from 'lucide-react';

export default function Navbar({
  transparent = false,
  scrolled = false,
  links = ['Home', 'Features', 'About'],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setIsOpen(false);
    navigate('/');
  };

  // Hide completely on the journal and wheel pages to avoid navigation collisions
  if (location.pathname === '/journal' || location.pathname === '/wheel') {
    return null;
  }

  // If authenticated, render floating bottom nav bar (Mockup Style)
  if (state.isAuthenticated) {
    const navItems = [
      { path: '/dashboard', label: 'Home', Icon: Home },
      { path: '/journal', label: 'Journal', Icon: BookOpen },
      { path: '/coach', label: 'Coach', Icon: MessageSquare },
      { path: '/wheel', label: 'Wheel', Icon: Disc },
      { path: '/tasks', label: 'Tasks', Icon: ClipboardCheck },
      { path: '/profile', label: 'Profile', Icon: User },
    ];

    return (
      <div className="fixed bottom-6 left-0 right-0 max-w-[430px] mx-auto w-full px-6 z-50 pointer-events-none">
        <nav className="w-full bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-full py-3 px-4 shadow-2xl flex justify-between items-center pointer-events-auto animate-fade-in">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center transition-all ${
                  isActive
                    ? 'w-11 h-11 rounded-full bg-white text-slate-900 shadow-md scale-105'
                    : 'w-11 h-11 text-white/60 hover:text-white hover:scale-105'
                }`}
              >
                <item.Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // If unauthenticated, render normal top fixed navbar
  const bgColor = transparent && !scrolled ? 'bg-transparent' : 'bg-white shadow-sm';
  const textColor = transparent && !scrolled ? 'text-white' : 'text-primary';
  const linkColor = transparent && !scrolled ? 'text-white/90' : 'text-gray-600';
  const activeLinkColor = 'text-gold';

  return (
    <nav className={`fixed top-0 left-0 right-0 max-w-[430px] mx-auto w-full z-50 transition-all duration-300 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="text-primary" fill="#6366f1" />
                <path d="M12 2v20M2 12h20" stroke="#f97316" />
              </svg>
              <span className={`font-bold text-xl ${textColor}`}>Wheel of Life</span>
            </Link>
          </div>

          <div className="hidden">
            {links.map((link) => (
              <Link
                key={link}
                to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
                className={`${linkColor} hover:${activeLinkColor} transition-colors font-medium`}
              >
                {link}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={`${textColor} p-2 hover:opacity-80 transition-opacity`}
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg animate-fade-in">
          {links.map((link) => (
            <Link
              key={link}
              to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gold hover:bg-gray-50 transition-colors"
            >
              {link}
            </Link>
          ))}
          
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block text-center px-4 py-2 text-primary font-bold rounded-xl hover:bg-gray-50 text-sm"
            >
              Sign In
            </Link>
            <Link
              to="/onboarding"
              onClick={() => setIsOpen(false)}
              className="block text-center px-4 py-2 bg-gold text-primary font-bold rounded-xl hover:bg-gold-dark transition-colors text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

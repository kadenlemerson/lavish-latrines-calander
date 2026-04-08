import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isDark = loc.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isDark
        ? 'bg-white border-b border-cream-200 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className={`font-serif text-xl font-bold tracking-wider ${
          scrolled || !isDark ? 'text-dark-800' : 'text-gold-400'
        }`}>
          LAVISH LATRINES
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/book" className={`font-medium hover:text-gold-500 transition-colors text-sm tracking-wide ${
            scrolled || !isDark ? 'text-dark-700' : 'text-cream-200'
          }`}>
            Book Now
          </Link>
          <Link to="/quote" className={`font-medium hover:text-gold-500 transition-colors text-sm tracking-wide ${
            scrolled || !isDark ? 'text-dark-700' : 'text-cream-200'
          }`}>
            Get a Quote
          </Link>
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/staff'}
                className={`font-medium hover:text-gold-500 transition-colors text-sm ${
                  scrolled || !isDark ? 'text-dark-700' : 'text-cream-200'
                }`}
              >
                Dashboard
              </Link>
              <button onClick={logout} className="btn-outline text-sm py-2 px-4">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-gold text-sm py-2 px-5">
              Staff Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 ${scrolled || !isDark ? 'text-dark-800' : 'text-white'}`}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-cream-200 px-6 py-4 space-y-3">
          <Link to="/book" className="block text-dark-700 font-medium py-2" onClick={() => setOpen(false)}>Book Now</Link>
          <Link to="/quote" className="block text-dark-700 font-medium py-2" onClick={() => setOpen(false)}>Get a Quote</Link>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/staff'} className="block text-dark-700 font-medium py-2" onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="text-red-600 font-medium py-2">Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="block btn-gold text-center" onClick={() => setOpen(false)}>Staff Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}

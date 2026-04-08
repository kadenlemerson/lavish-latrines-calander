import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingsTable from '../components/BookingsTable';
import AdminCalendar from '../components/AdminCalendar';

const TABS = [
  { id: 'bookings', label: 'Bookings', icon: '📋' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
];

export default function StaffDashboard() {
  const [tab, setTab] = useState('bookings');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-dark-700">
          <h1 className="font-serif text-gold-400 font-bold text-xl tracking-wider">LAVISH LATRINES</h1>
          <p className="text-dark-400 text-xs mt-1">Staff Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                tab === t.id
                  ? 'bg-gold-500 text-dark-800'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-dark-800 font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.name}</p>
              <p className="text-dark-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full text-dark-400 hover:text-red-400 text-sm transition-colors py-1">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-800 border-t border-dark-700 flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              tab === t.id ? 'text-gold-400' : 'text-dark-400'
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 z-10 bg-white border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-dark-800">
              {TABS.find(t => t.id === tab)?.label}
            </h2>
            <p className="text-dark-400 text-xs">Staff View · Read Only</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-dark-400 hover:text-red-500 text-sm md:hidden">
            Sign Out
          </button>
        </div>
        <div className="p-6">
          {tab === 'bookings' && <BookingsTable isAdmin={false} />}
          {tab === 'calendar' && <AdminCalendar />}
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import RevenueCharts from '../components/RevenueCharts';
import BookingsTable from '../components/BookingsTable';
import CustomersTable from '../components/CustomersTable';
import QuotesTable from '../components/QuotesTable';
import AdminCalendar from '../components/AdminCalendar';
import UsersPanel from '../components/UsersPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'bookings', label: 'Bookings', icon: '📋' },
  { id: 'customers', label: 'Customers', icon: '👤' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'quotes', label: 'Quotes', icon: '💬' },
  { id: 'revenue', label: 'Revenue', icon: '📊' },
  { id: 'users', label: 'Staff', icon: '🔑' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/revenue/summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  const t = summary?.totals;

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-dark-700">
          <h1 className="font-serif text-gold-400 font-bold text-xl tracking-wider">LAVISH LATRINES</h1>
          <p className="text-dark-400 text-xs mt-1">Business Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                tab === t.id
                  ? 'bg-gold-500 text-white'
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
            <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-800 border-t border-dark-700 flex">
        {TABS.slice(0, 5).map(t => (
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

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-dark-800">
              {TABS.find(t => t.id === tab)?.label}
            </h2>
            <p className="text-dark-400 text-xs">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.open('/', '_blank')} className="btn-outline text-sm py-1.5 px-3 hidden sm:block">
              View Site
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-dark-400 hover:text-red-500 text-sm md:hidden">
              Sign Out
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === 'overview' && <OverviewTab summary={summary} onTabChange={setTab} />}
          {tab === 'bookings' && <BookingsTable isAdmin={true} />}
          {tab === 'customers' && <CustomersTable />}
          {tab === 'calendar' && <AdminCalendar />}
          {tab === 'quotes' && <QuotesTable isAdmin={true} />}
          {tab === 'revenue' && <RevenueCharts />}
          {tab === 'users' && <UsersPanel />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'gold' }) {
  const colors = {
    gold: 'from-gold-500 to-gold-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600'
  };
  return (
    <div className="card-luxury">
      <div className={`bg-gradient-to-br ${colors[color]} p-5`}>
        <p className="text-white/80 text-xs font-medium tracking-wider uppercase">{label}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function OverviewTab({ summary, onTabChange }) {
  const t = summary?.totals;
  const upcoming = summary?.upcomingBookings || [];
  const year = summary?.year || new Date().getFullYear();

  function fmt(n) {
    return n ? `$${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={t?.total_bookings || 0} sub={`${year} season`} color="gold" />
        <StatCard label="Total Revenue" value={fmt(t?.total_revenue)} sub="Confirmed bookings" color="green" />
        <StatCard label="Deposits Collected" value={fmt(t?.deposits_collected)} sub="Payments received" color="blue" />
        <StatCard label="Balance Outstanding" value={fmt(t?.balance_outstanding)} sub="Due at delivery" color="purple" />
      </div>

      {/* Booking status breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Confirmed', count: t?.confirmed_bookings || 0, color: 'bg-green-500' },
          { label: 'Completed', count: t?.completed_bookings || 0, color: 'bg-blue-500' },
          { label: 'Cancelled', count: t?.cancelled_bookings || 0, color: 'bg-red-400' }
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-white text-xl font-bold`}>
              {s.count}
            </div>
            <div>
              <p className="font-semibold text-dark-800">{s.label}</p>
              <p className="text-dark-400 text-sm">bookings this year</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-dark-800">Upcoming Bookings</h3>
          <button onClick={() => onTabChange('bookings')} className="text-gold-600 text-sm hover:underline">View all →</button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-dark-400 text-sm py-4 text-center">No upcoming bookings.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-lg border border-cream-200">
                <div>
                  <p className="font-semibold text-dark-800 text-sm">{b.customer_name}</p>
                  <p className="text-dark-500 text-xs">{formatDate(b.event_date)} · {b.event_type || 'Event'} · Trailer #{b.trailer_number}</p>
                  {b.location && <p className="text-dark-400 text-xs">{b.location}</p>}
                </div>
                <div className="text-right">
                  <span className={`badge-${b.deposit_paid ? 'green' : 'gold'} text-xs`}>
                    {b.deposit_paid ? 'Deposit Paid' : 'Deposit Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

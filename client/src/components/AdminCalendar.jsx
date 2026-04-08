import React, { useState, useEffect } from 'react';
import api from '../api';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function AdminCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const monthKey = `${year}-${String(month).padStart(2,'0')}`;

  useEffect(() => {
    setLoading(true);
    api.get(`/revenue/calendar?month=${monthKey}`)
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  }, [monthKey]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  // Group bookings by date
  const byDate = {};
  bookings.forEach(b => {
    if (!byDate[b.event_date]) byDate[b.event_date] = [];
    byDate[b.event_date].push(b);
  });

  const dayBookings = selectedDate ? (byDate[selectedDate] || []) : [];

  const trailerColors = ['bg-gold-500', 'bg-blue-500'];

  return (
    <div className="space-y-4">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">‹</button>
          <div className="text-center">
            <h3 className="font-serif font-bold text-dark-800 text-xl">{MONTHS[month-1]} {year}</h3>
            {loading && <p className="text-xs text-dark-400">Loading...</p>}
          </div>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-dark-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayData = byDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isFull = dayData.length >= 2;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative min-h-[56px] rounded-lg p-1 text-left transition-all ${
                  isSelected ? 'ring-2 ring-gold-500 bg-gold-50' :
                  isToday ? 'ring-2 ring-dark-600 bg-cream-50' :
                  'hover:bg-cream-50'
                }`}
              >
                <span className={`text-xs font-medium block mb-1 ${
                  isToday ? 'text-dark-800 font-bold' : 'text-dark-600'
                }`}>{day}</span>
                <div className="flex flex-col gap-0.5">
                  {dayData.map((b, bi) => (
                    <div key={b.id || bi}
                      className={`text-[10px] px-1 py-0.5 rounded text-white truncate ${trailerColors[b.trailer_number - 1] || 'bg-gray-500'}`}
                      title={`${b.customer_name} · ${b.event_type || ''}`}>
                      {b.customer_name?.split(' ')[0]}
                    </div>
                  ))}
                </div>
                {isFull && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full" title="Fully booked" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-dark-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gold-500" />
            <span>Trailer #1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Trailer #2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span>Both Booked</span>
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-serif font-bold text-dark-800">
              {formatDateFull(selectedDate)}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-dark-400 hover:text-dark-700">✕</button>
          </div>
          {dayBookings.length === 0 ? (
            <p className="text-dark-400 text-sm">No bookings on this date.</p>
          ) : (
            <div className="space-y-3">
              {dayBookings.map(b => (
                <div key={b.id} className="flex items-start gap-3 p-3 bg-cream-50 rounded-lg">
                  <div className={`w-2 h-full min-h-[40px] rounded-full ${trailerColors[b.trailer_number - 1] || 'bg-gray-400'}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-dark-800">{b.customer_name}</p>
                    <p className="text-dark-500 text-xs">{b.customer_phone}</p>
                    <p className="text-dark-500 text-xs">Trailer #{b.trailer_number} · {b.event_type || 'Event'}</p>
                    {b.location && <p className="text-dark-400 text-xs">📍 {b.location}</p>}
                  </div>
                </div>
              ))}
              {dayBookings.length < 2 && (
                <p className="text-dark-400 text-xs">1 trailer slot remaining for this date.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDateFull(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const date = new Date(parseInt(y), parseInt(m)-1, parseInt(day));
  return `${days[date.getDay()]}, ${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

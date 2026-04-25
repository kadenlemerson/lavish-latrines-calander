import React, { useState, useEffect } from 'react';
import api from '../api';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function BookingCalendar({ onSelectDate, readOnly = false, highlightedDates = [] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const key = `${year}-${String(month).padStart(2,'0')}`;
    setLoading(true);
    api.get(`/bookings/available?month=${key}`)
      .then(r => setAvailability(r.data))
      .catch(() => setAvailability({}))
      .finally(() => setLoading(false));
  }, [year, month]);

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
  const todayStr = today();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  function getDayInfo(day) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const avail = availability[dateStr];
    const isPast = dateStr < todayStr;
    const isBlocked = avail?.blocked || false;
    const isHighlighted = highlightedDates.includes(dateStr);
    const availCount = avail?.available ?? 2;
    return { dateStr, isPast, isBlocked, isHighlighted, availCount };
  }

  return (
    <div className="card max-w-lg mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-600"
        >
          ‹
        </button>
        <div className="text-center">
          <h3 className="font-serif font-bold text-dark-800 text-xl">
            {MONTHS[month - 1]} {year}
          </h3>
          {loading && <p className="text-xs text-dark-400 mt-0.5">Loading...</p>}
        </div>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-600"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-dark-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const { dateStr, isPast, isBlocked, isHighlighted, availCount } = getDayInfo(day);

          let classes = 'relative h-11 rounded-lg flex flex-col items-center justify-center text-sm transition-all ';
          let tooltip = '';

          if (isPast || isBlocked) {
            classes += 'text-dark-300 bg-cream-100 cursor-not-allowed ';
            tooltip = isBlocked ? 'Fully booked' : 'Date passed';
          } else if (isHighlighted) {
            classes += 'bg-gold-500 text-white font-bold cursor-default ';
          } else if (!readOnly) {
            classes += 'cursor-pointer hover:bg-gold-100 hover:text-gold-700 text-dark-700 ';
            if (hovered === dateStr) classes += 'ring-2 ring-gold-400 ';
          } else {
            classes += 'text-dark-700 ';
          }

          return (
            <button
              key={dateStr}
              disabled={isPast || isBlocked || readOnly}
              className={classes}
              onClick={() => !isPast && !isBlocked && !readOnly && onSelectDate && onSelectDate(dateStr)}
              onMouseEnter={() => setHovered(dateStr)}
              onMouseLeave={() => setHovered(null)}
              title={tooltip}
            >
              <span>{day}</span>
              {!isPast && !isBlocked && availCount === 1 && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" title="1 trailer left" />
              )}
              {isBlocked && (
                <span className="w-1 h-1 rounded-full bg-red-300 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-dark-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-white border border-cream-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-cream-100 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
          </div>
          <span>Fully Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-white border border-cream-200 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <span>1 Trailer Left</span>
        </div>
      </div>
    </div>
  );
}

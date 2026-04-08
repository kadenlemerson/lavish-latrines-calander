import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../api';

const GOLD = '#C9A84C';
const DARK = '#1a1a1a';
const BLUE = '#3b82f6';
const GREEN = '#22c55e';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) {
  return `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function RevenueCharts() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/revenue/summary?year=${year}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-dark-400">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const t = data?.totals;
  const monthly = (data?.byMonth || []).map(m => ({
    month: MONTH_NAMES[parseInt(m.month.split('-')[1]) - 1],
    revenue: parseFloat(m.revenue || 0),
    deposits: parseFloat(m.deposits || 0),
    bookings: m.bookings
  }));

  // Fill missing months with zeros (Apr-Oct for summer season)
  const seasonMonths = ['Apr','May','Jun','Jul','Aug','Sep','Oct'];
  const chartData = seasonMonths.map(m => {
    const found = monthly.find(d => d.month === m);
    return found || { month: m, revenue: 0, deposits: 0, bookings: 0 };
  });

  const pieData = [
    { name: 'Collected', value: parseFloat(t?.deposits_collected || 0) },
    { name: 'Outstanding', value: parseFloat(t?.balance_outstanding || 0) }
  ];
  const PIE_COLORS = [GREEN, GOLD];

  const yearOptions = [];
  for (let y = 2024; y <= new Date().getFullYear() + 1; y++) yearOptions.push(y);

  return (
    <div className="space-y-6">
      {/* Year filter */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-dark-800">Revenue Analytics</h3>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-auto">
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(t?.total_revenue), change: `${t?.total_bookings || 0} bookings` },
          { label: 'Deposits Collected', value: fmt(t?.deposits_collected), change: 'payments received' },
          { label: 'Balance Due', value: fmt(t?.balance_outstanding), change: 'at delivery' },
          { label: 'Confirmed', value: t?.confirmed_bookings || 0, change: 'active bookings' }
        ].map(k => (
          <div key={k.label} className="card-luxury overflow-hidden">
            <div className="p-5">
              <p className="text-dark-500 text-xs uppercase tracking-wider">{k.label}</p>
              <p className="text-dark-800 text-2xl font-bold mt-1">{k.value}</p>
              <p className="text-dark-400 text-xs mt-1">{k.change}</p>
            </div>
            <div className="h-1 bg-gold-gradient" />
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="card">
        <h4 className="font-serif font-bold text-dark-800 mb-4">Monthly Revenue – {year} Season</h4>
        {chartData.every(d => d.revenue === 0) ? (
          <p className="text-dark-400 text-sm text-center py-8">No revenue data for {year} yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#777' }} />
              <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontSize: 11, fill: '#777' }} />
              <Tooltip
                formatter={(v, name) => [fmt(v), name === 'revenue' ? 'Total Revenue' : 'Deposits']}
                contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff' }}
                labelStyle={{ color: '#C9A84C' }}
              />
              <Legend formatter={v => v === 'revenue' ? 'Total Revenue' : 'Deposits Received'} />
              <Bar dataKey="revenue" name="revenue" fill={GOLD} radius={[4,4,0,0]} />
              <Bar dataKey="deposits" name="deposits" fill={DARK} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bookings per month + Payment breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="font-serif font-bold text-dark-800 mb-4">Bookings Per Month</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#777' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777' }} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff' }}
                labelStyle={{ color: '#C9A84C' }} />
              <Line type="monotone" dataKey="bookings" stroke={GOLD} strokeWidth={2.5}
                dot={{ fill: GOLD, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4 className="font-serif font-bold text-dark-800 mb-4">Payment Collection</h4>
          {pieData[0].value === 0 && pieData[1].value === 0 ? (
            <p className="text-dark-400 text-sm text-center py-12">No payment data yet.</p>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)}
                    contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <div>
                      <p className="text-sm font-medium text-dark-700">{d.name}</p>
                      <p className="text-xs text-dark-400">{fmt(d.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

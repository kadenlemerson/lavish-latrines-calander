import React, { useState, useEffect } from 'react';
import api from '../api';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  booked: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600'
};

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

export default function QuotesTable({ isAdmin }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/quotes${params}`).then(r => setQuotes(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  function startEdit(q) {
    setEditing(q);
    setNotes(q.admin_notes || '');
    setPrice(q.estimated_price || '');
    setStatus(q.status);
  }

  async function saveEdit() {
    setSaving(true);
    await api.put(`/quotes/${editing.id}`, {
      status,
      adminNotes: notes,
      estimatedPrice: price ? parseFloat(price) : null
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Quotes</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="quoted">Quoted</option>
          <option value="booked">Booked</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <div className="card-luxury overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-dark-400">Loading quotes...</div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center text-dark-400">No quotes found.</div>
        ) : (
          <div className="divide-y divide-cream-100">
            {quotes.map(q => (
              <div key={q.id} className="p-4 hover:bg-cream-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-dark-800">{q.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-600'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-dark-500 text-sm">{q.email} {q.phone ? `· ${q.phone}` : ''}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-dark-500">
                      <span>📅 {formatDate(q.requested_start)}{q.requested_end ? ` – ${formatDate(q.requested_end)}` : ''}</span>
                      <span>🚽 {q.num_trailers} trailer{q.num_trailers !== 1 ? 's' : ''}</span>
                      {q.event_type && <span>🎉 {q.event_type}</span>}
                      {q.location && <span>📍 {q.location}</span>}
                      {q.estimated_guests && <span>👥 {q.estimated_guests} guests</span>}
                    </div>
                    {q.notes && (
                      <p className="mt-1 text-xs text-dark-400 italic">{q.notes}</p>
                    )}
                    {q.admin_notes && (
                      <div className="mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <strong>Admin note:</strong> {q.admin_notes}
                      </div>
                    )}
                    {q.estimated_price && (
                      <p className="mt-1 text-sm font-semibold text-gold-600">
                        Quoted: ${parseFloat(q.estimated_price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(q)} className="text-xs bg-dark-100 hover:bg-dark-200 text-dark-700 px-3 py-1.5 rounded transition-colors">
                        Update
                      </button>
                      <a href={`mailto:${q.email}?subject=Quote%20for%20Your%20Event%20-%20Lavish%20Latrines`}
                        className="text-xs bg-gold-100 hover:bg-gold-200 text-gold-700 px-3 py-1.5 rounded transition-colors">
                        Email
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-dark-400 mt-2">Received: {new Date(q.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-xl font-bold">Update Quote</h3>
              <button onClick={() => setEditing(null)} className="text-dark-400 hover:text-dark-700">✕</button>
            </div>
            <p className="text-dark-600 text-sm mb-4">
              <strong>{editing.name}</strong> · {formatDate(editing.requested_start)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="quoted">Quoted</option>
                  <option value="booked">Booked</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Price ($)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="input-field" placeholder="e.g. 2200" step="50" />
              </div>
              <div>
                <label className="label">Admin Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Internal notes about this quote..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} disabled={saving} className="btn-gold flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-dark-400 text-xs text-right">{quotes.length} quote{quotes.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

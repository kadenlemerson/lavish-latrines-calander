import React, { useState, useEffect } from 'react';
import api from '../api';
import AdminBookingModal from './AdminBookingModal';

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

function StatusBadge({ status }) {
  const map = {
    confirmed: 'badge-green',
    cancelled: 'badge-red',
    completed: 'badge-gold',
    pending: 'badge-gray'
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
}

export default function BookingsTable({ isAdmin }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/bookings?${params}`).then(r => setBookings(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    await api.delete(`/bookings/${id}`);
    load();
  }

  async function markComplete(id) {
    await api.put(`/bookings/${id}`, { status: 'completed' });
    load();
  }

  async function markDepositPaid(id) {
    await api.put(`/bookings/${id}`, { depositPaid: true, paymentStatus: 'paid' });
    load();
  }

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.customer_name?.toLowerCase().includes(s) ||
      b.customer_email?.toLowerCase().includes(s) ||
      b.event_date?.includes(s) ||
      b.event_type?.toLowerCase().includes(s) ||
      b.location?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters + New Booking */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email, date, event type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-gold text-sm py-2 px-5 whitespace-nowrap">
            + New Booking
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-dark-400">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading bookings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-dark-400">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-800 text-dark-300">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gold-500">Ref</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Trailer</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Payment</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-cream-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(selected?.id === b.id ? null : b)}>
                    <td className="px-4 py-3 text-gold-600 font-mono font-semibold">
                      #LL-{String(b.id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark-800">{b.customer_name}</div>
                      <div className="text-dark-400 text-xs">{b.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-dark-700 whitespace-nowrap">
                      {formatDate(b.event_date)}
                    </td>
                    <td className="px-4 py-3 text-dark-600">{b.event_type || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge-gray">#{b.trailer_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      {b.deposit_paid
                        ? <span className="badge-green">Deposit Paid</span>
                        : <span className="badge-gold">Pending</span>}
                      <div className="text-dark-400 text-xs mt-0.5">
                        ${parseFloat(b.deposit_amount || 0).toFixed(0)} / ${parseFloat(b.balance_due || 0).toFixed(0)} bal
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                      {b.contract_signed ? <div className="text-green-600 text-xs mt-0.5">✓ Signed</div> : null}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {!b.deposit_paid && b.status !== 'cancelled' && (
                            <button onClick={() => markDepositPaid(b.id)}
                              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors">
                              Paid
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <button onClick={() => markComplete(b.id)}
                              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors">
                              Done
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button onClick={() => cancelBooking(b.id)}
                              className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card border-l-4 border-gold-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-serif text-lg font-bold">
              Booking #LL-{String(selected.id).padStart(4, '0')}
            </h3>
            <button onClick={() => setSelected(null)} className="text-dark-400 hover:text-dark-700">✕</button>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-dark-400 uppercase text-xs tracking-wider mb-2">Customer</p>
              <p className="font-medium">{selected.customer_name}</p>
              <p className="text-dark-500">{selected.customer_email}</p>
              <p className="text-dark-500">{selected.customer_phone}</p>
            </div>
            <div>
              <p className="text-dark-400 uppercase text-xs tracking-wider mb-2">Event</p>
              <p><span className="text-dark-500">Date:</span> <strong>{formatDate(selected.event_date)}</strong></p>
              <p><span className="text-dark-500">Type:</span> {selected.event_type || '—'}</p>
              <p><span className="text-dark-500">Location:</span> {selected.location || '—'}</p>
              {selected.location_address && <p className="text-dark-400 text-xs mt-1">{selected.location_address}</p>}
            </div>
            <div>
              <p className="text-dark-400 uppercase text-xs tracking-wider mb-2">Financials</p>
              <p><span className="text-dark-500">Total:</span> <strong>${parseFloat(selected.base_price).toFixed(2)}</strong></p>
              <p><span className="text-dark-500">Deposit:</span> ${parseFloat(selected.deposit_amount || 0).toFixed(2)} {selected.deposit_paid ? '✓' : '(pending)'}</p>
              <p><span className="text-dark-500">Balance:</span> ${parseFloat(selected.balance_due || 0).toFixed(2)}</p>
              {selected.square_payment_id && <p className="text-dark-400 text-xs mt-1 font-mono">ID: {selected.square_payment_id.slice(0, 20)}...</p>}
            </div>
          </div>
          {selected.notes && (
            <div className="mt-4 p-3 bg-cream-50 rounded text-sm text-dark-600">
              <span className="text-dark-400 font-medium">Notes: </span>{selected.notes}
            </div>
          )}
        </div>
      )}

      <p className="text-dark-400 text-xs text-right">{filtered.length} booking{filtered.length !== 1 ? 's' : ''} shown</p>

      {showModal && (
        <AdminBookingModal
          defaultDate=""
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

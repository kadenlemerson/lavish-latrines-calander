import React, { useState, useEffect } from 'react';
import api from '../api';

export default function CustomersTable() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function load(q = '') {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    api.get(`/customers${params}`).then(r => setCustomers(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadDetail(id) {
    setLoadingDetail(true);
    const r = await api.get(`/customers/${id}`);
    setSelected(r.data);
    setLoadingDetail(false);
  }

  function fmt(n) {
    return n ? `$${parseFloat(n).toFixed(2)}` : '$0.00';
  }

  function formatDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search customers by name, email, or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field"
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Customer list */}
        <div className="lg:col-span-1 card-luxury overflow-hidden max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-dark-400">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-dark-400">No customers found.</div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {customers.map(c => (
                <li
                  key={c.id}
                  onClick={() => loadDetail(c.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-cream-50 transition-colors ${
                    selected?.id === c.id ? 'bg-gold-50 border-l-4 border-gold-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-dark-800 rounded-full flex items-center justify-center text-gold-400 font-bold text-sm flex-shrink-0">
                      {c.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-dark-800 text-sm truncate">{c.name}</p>
                      <p className="text-dark-400 text-xs truncate">{c.email}</p>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <span className="badge-gold text-xs">{c.total_bookings} booking{c.total_bookings !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customer detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card h-full flex items-center justify-center text-dark-400 min-h-[200px]">
              <div className="text-center">
                <div className="text-4xl mb-3">👤</div>
                <p>Select a customer to view details</p>
              </div>
            </div>
          ) : loadingDetail ? (
            <div className="card flex items-center justify-center min-h-[200px]">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="card space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-dark-800 rounded-full flex items-center justify-center text-gold-400 font-bold text-xl">
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-dark-800">{selected.name}</h3>
                  <p className="text-dark-500 text-sm">{selected.email}</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Phone', selected.phone],
                  ['City', `${selected.city || ''}${selected.state ? ', ' + selected.state : ''}`],
                  ['Address', selected.address],
                  ['ZIP', selected.zip],
                ].filter(([, v]) => v?.trim()).map(([label, val]) => (
                  <div key={label}>
                    <p className="text-dark-400 text-xs">{label}</p>
                    <p className="text-dark-700">{val}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Bookings', selected.bookings?.length || 0],
                  ['Total Revenue', fmt(selected.bookings?.reduce((s, b) => s + (b.base_price || 0), 0))],
                  ['Paid', fmt(selected.bookings?.filter(b => b.deposit_paid).reduce((s, b) => s + (b.deposit_amount || 0), 0))],
                ].map(([label, val]) => (
                  <div key={label} className="bg-cream-50 rounded-lg p-3 text-center">
                    <p className="text-dark-400 text-xs">{label}</p>
                    <p className="font-bold text-dark-800">{val}</p>
                  </div>
                ))}
              </div>

              {/* Booking history */}
              {selected.bookings?.length > 0 && (
                <div>
                  <h4 className="font-medium text-dark-700 text-sm mb-2">Booking History</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selected.bookings.map(b => (
                      <div key={b.id} className="flex justify-between items-center p-2 bg-cream-50 rounded text-xs">
                        <div>
                          <span className="text-gold-600 font-mono">#LL-{String(b.id).padStart(4,'0')}</span>
                          <span className="ml-2 text-dark-600">{formatDate(b.event_date)}</span>
                          {b.event_type && <span className="ml-2 text-dark-400">· {b.event_type}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                          }`}>{b.status}</span>
                          <span className="text-dark-600 font-medium">${parseFloat(b.base_price).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="p-3 bg-amber-50 rounded border border-amber-200">
                  <p className="text-xs text-amber-700"><strong>Notes:</strong> {selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-dark-400 text-xs text-right">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

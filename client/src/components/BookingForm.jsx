import React, { useState } from 'react';

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary',
  'Graduation', 'Outdoor Festival', 'Charity Gala', 'Private Party', 'Other'
];

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

export default function BookingForm({ selectedDate, onSubmit }) {
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerCity: '', customerState: 'WA', customerZip: '',
    eventType: '', location: '', locationAddress: '', notes: ''
  });
  const [errors, setErrors] = useState({});

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Name is required';
    if (!form.customerEmail.trim()) errs.customerEmail = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.customerEmail)) errs.customerEmail = 'Valid email required';
    if (!form.customerPhone.trim()) errs.customerPhone = 'Phone is required';
    if (!form.eventType) errs.eventType = 'Event type is required';
    if (!form.location.trim()) errs.location = 'Event location / venue is required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, eventDate: selectedDate });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Selected date banner */}
      <div className="bg-dark-800 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div>
          <p className="text-gold-400 text-xs tracking-widest uppercase">Selected Date</p>
          <p className="font-serif text-xl font-bold text-white">{formatDateDisplay(selectedDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-cream-400 text-xs">Base Price</p>
          <p className="text-gold-400 font-bold text-xl">$1,100</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Your Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" value={form.customerName} onChange={set('customerName')}
                className={`input-field ${errors.customerName ? 'border-red-400' : ''}`}
                placeholder="Jane Smith" />
              {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input type="email" value={form.customerEmail} onChange={set('customerEmail')}
                className={`input-field ${errors.customerEmail ? 'border-red-400' : ''}`}
                placeholder="jane@example.com" />
              {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>}
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input type="tel" value={form.customerPhone} onChange={set('customerPhone')}
                className={`input-field ${errors.customerPhone ? 'border-red-400' : ''}`}
                placeholder="(360) 555-0000" />
              {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
            </div>
            <div>
              <label className="label">Street Address</label>
              <input type="text" value={form.customerAddress} onChange={set('customerAddress')}
                className="input-field" placeholder="123 Main St" />
            </div>
            <div>
              <label className="label">City</label>
              <input type="text" value={form.customerCity} onChange={set('customerCity')}
                className="input-field" placeholder="Vancouver" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <select value={form.customerState} onChange={set('customerState')} className="input-field">
                  <option>WA</option><option>OR</option><option>ID</option><option>CA</option>
                  <option>MT</option><option>NV</option><option>AZ</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">ZIP</label>
                <input type="text" value={form.customerZip} onChange={set('customerZip')}
                  className="input-field" placeholder="98660" maxLength={10} />
              </div>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Event Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type *</label>
              <select value={form.eventType} onChange={set('eventType')}
                className={`input-field ${errors.eventType ? 'border-red-400' : ''}`}>
                <option value="">Select event type...</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType}</p>}
            </div>
            <div>
              <label className="label">Venue / Location Name *</label>
              <input type="text" value={form.location} onChange={set('location')}
                className={`input-field ${errors.location ? 'border-red-400' : ''}`}
                placeholder="e.g. Riverside Vineyard" />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Delivery Address</label>
              <input type="text" value={form.locationAddress} onChange={set('locationAddress')}
                className="input-field" placeholder="Full address where trailer should be delivered" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Special Requests / Notes</label>
              <textarea value={form.notes} onChange={set('notes')}
                className="input-field min-h-[100px] resize-none"
                placeholder="Any special requirements, access instructions, or notes for our team..." />
            </div>
          </div>
        </div>

        {/* Pricing summary */}
        <div className="card bg-dark-800 text-white">
          <h3 className="font-serif text-lg font-bold text-gold-400 mb-4">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-cream-300">
              <span>Trailer Rental (1 day)</span>
              <span>$1,100.00</span>
            </div>
            <div className="border-t border-dark-600 pt-2 mt-2">
              <div className="flex justify-between text-gold-400 font-bold text-lg">
                <span>Deposit Due Today (50%)</span>
                <span>$550.00</span>
              </div>
              <div className="flex justify-between text-cream-400 text-sm mt-1">
                <span>Balance Due at Delivery</span>
                <span>$550.00</span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-gold w-full text-lg py-4">
          Continue to Payment & Signature →
        </button>
      </form>
    </div>
  );
}

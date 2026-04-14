import React, { useState } from 'react';
import api from '../api';

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary',
  'Graduation', 'Outdoor Festival', 'Charity Gala', 'Private Party', 'Other'
];

function Field({ label, children, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AdminBookingModal({ onClose, onCreated, defaultDate = '' }) {
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerCity: '', customerState: 'WA', customerZip: '',
    eventDate: defaultDate,
    eventType: '', location: '', locationAddress: '', addressDetails: '',
    trailerNumber: '',
    waterAccess: '', powerAccess: '', expectedGuests: '',
    notes: '',
    depositPaid: false,
    paymentStatus: 'pending',
    depositAmount: '550'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field) {
    return e => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(f => ({ ...f, [field]: val }));
    };
  }

  function validate() {
    const errs = {};
    if (!form.customerName.trim())  errs.customerName  = 'Required';
    if (!form.customerEmail.trim() || !/\S+@\S+\.\S+/.test(form.customerEmail))
      errs.customerEmail = 'Valid email required';
    if (!form.eventDate)            errs.eventDate     = 'Required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setServerError('');
    try {
      const res = await api.post('/bookings/admin', {
        ...form,
        depositAmount:  parseFloat(form.depositAmount) || 550,
        trailerNumber:  form.trailerNumber ? parseInt(form.trailerNumber) : undefined,
        depositPaid:    form.depositPaid,
        paymentStatus:  form.depositPaid ? 'paid' : 'pending'
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-dark-gradient px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-gold-400">Add Manual Booking</h2>
            <p className="text-dark-400 text-sm">Log a booking for a customer who called directly</p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white text-xl transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Customer */}
          <div>
            <h3 className="font-serif font-bold text-dark-700 text-base mb-3 pb-1 border-b border-cream-200">
              Customer Information
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Full Name *" error={errors.customerName}>
                <input type="text" value={form.customerName} onChange={set('customerName')}
                  className={`input-field ${errors.customerName ? 'border-red-400' : ''}`}
                  placeholder="Jane Smith" />
              </Field>
              <Field label="Email *" error={errors.customerEmail}>
                <input type="email" value={form.customerEmail} onChange={set('customerEmail')}
                  className={`input-field ${errors.customerEmail ? 'border-red-400' : ''}`}
                  placeholder="jane@example.com" />
              </Field>
              <Field label="Phone">
                <input type="tel" value={form.customerPhone} onChange={set('customerPhone')}
                  className="input-field" placeholder="(360) 555-0000" />
              </Field>
              <Field label="City / State">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={form.customerCity} onChange={set('customerCity')}
                    className="input-field" placeholder="Vancouver" />
                  <select value={form.customerState} onChange={set('customerState')} className="input-field">
                    {['WA','OR','ID','CA','MT','NV','AZ','Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </Field>
            </div>
          </div>

          {/* Event */}
          <div>
            <h3 className="font-serif font-bold text-dark-700 text-base mb-3 pb-1 border-b border-cream-200">
              Event Details
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Event Date *" error={errors.eventDate}>
                <input type="date" value={form.eventDate} onChange={set('eventDate')}
                  className={`input-field ${errors.eventDate ? 'border-red-400' : ''}`} />
              </Field>
              <Field label="Trailer Preference">
                <select value={form.trailerNumber} onChange={set('trailerNumber')} className="input-field">
                  <option value="">Auto-assign</option>
                  <option value="1">Trailer #1</option>
                  <option value="2">Trailer #2</option>
                </select>
              </Field>
              <Field label="Event Type">
                <select value={form.eventType} onChange={set('eventType')} className="input-field">
                  <option value="">Select...</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Venue Name">
                <input type="text" value={form.location} onChange={set('location')}
                  className="input-field" placeholder="e.g. Riverside Vineyard" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Delivery Address">
                  <input type="text" value={form.locationAddress} onChange={set('locationAddress')}
                    className="input-field" placeholder="Full delivery address" />
                </Field>
              </div>
              <Field label="Expected Guests">
                <input type="text" value={form.expectedGuests} onChange={set('expectedGuests')}
                  className="input-field" placeholder="e.g. 150" />
              </Field>
              <Field label="Water Access">
                <input type="text" value={form.waterAccess} onChange={set('waterAccess')}
                  className="input-field" placeholder="Yes / No / Details" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Power Access">
                  <input type="text" value={form.powerAccess} onChange={set('powerAccess')}
                    className="input-field" placeholder="Yes / No / Details" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea value={form.notes} onChange={set('notes')}
                    className="input-field min-h-[70px] resize-none"
                    placeholder="Any special instructions or notes about this booking..." />
                </Field>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="font-serif font-bold text-dark-700 text-base mb-3 pb-1 border-b border-cream-200">
              Payment Status
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Deposit Amount ($)">
                <input type="number" value={form.depositAmount} onChange={set('depositAmount')}
                  className="input-field" step="50" min="0" />
              </Field>
              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="depositPaid"
                  checked={form.depositPaid}
                  onChange={set('depositPaid')}
                  className="w-4 h-4 accent-gold-500"
                />
                <label htmlFor="depositPaid" className="text-dark-700 font-medium text-sm cursor-pointer">
                  Deposit has been collected
                </label>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-gold flex-1 py-3">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-800 border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : 'Create Booking'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

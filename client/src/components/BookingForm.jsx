import React, { useState } from 'react';

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary',
  'Graduation', 'Outdoor Festival', 'Charity Gala', 'Private Party', 'Other'
];

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function BookingForm({ selectedDate, onSubmit }) {
  const [form, setForm] = useState({
    // Contact
    customerName: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerCity: '', customerState: 'WA', customerZip: '',
    // Event
    eventType: '', location: '', locationAddress: '', addressDetails: '',
    // Venue details
    waterAccess: '', powerAccess: '', expectedGuests: '',
    // Extra
    notes: ''
  });
  const [errors, setErrors] = useState({});

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.customerName.trim())  errs.customerName  = 'Name is required';
    if (!form.customerEmail.trim() || !/\S+@\S+\.\S+/.test(form.customerEmail))
      errs.customerEmail = 'Valid email required';
    if (!form.customerPhone.trim()) errs.customerPhone = 'Phone is required';
    if (!form.eventType)            errs.eventType     = 'Event type is required';
    if (!form.location.trim())      errs.location      = 'Venue / location name is required';
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

        {/* ── Contact Information ── */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Your Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full Name *" error={errors.customerName}>
              <input type="text" value={form.customerName} onChange={set('customerName')}
                className={`input-field ${errors.customerName ? 'border-red-400' : ''}`}
                placeholder="Jane Smith" />
            </Field>
            <Field label="Email Address *" error={errors.customerEmail}>
              <input type="email" value={form.customerEmail} onChange={set('customerEmail')}
                className={`input-field ${errors.customerEmail ? 'border-red-400' : ''}`}
                placeholder="jane@example.com" />
            </Field>
            <Field label="Phone Number *" error={errors.customerPhone}>
              <input type="tel" value={form.customerPhone} onChange={set('customerPhone')}
                className={`input-field ${errors.customerPhone ? 'border-red-400' : ''}`}
                placeholder="(360) 555-0000" />
            </Field>
            <Field label="Street Address">
              <input type="text" value={form.customerAddress} onChange={set('customerAddress')}
                className="input-field" placeholder="123 Main St" />
            </Field>
            <Field label="City">
              <input type="text" value={form.customerCity} onChange={set('customerCity')}
                className="input-field" placeholder="Vancouver" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State">
                <select value={form.customerState} onChange={set('customerState')} className="input-field">
                  {['WA','OR','ID','CA','MT','NV','AZ','Other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="ZIP">
                <input type="text" value={form.customerZip} onChange={set('customerZip')}
                  className="input-field" placeholder="98660" maxLength={10} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Event Details ── */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Event Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Event Type *" error={errors.eventType}>
              <select value={form.eventType} onChange={set('eventType')}
                className={`input-field ${errors.eventType ? 'border-red-400' : ''}`}>
                <option value="">Select event type...</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Venue / Location Name *" error={errors.location}>
              <input type="text" value={form.location} onChange={set('location')}
                className={`input-field ${errors.location ? 'border-red-400' : ''}`}
                placeholder="e.g. Riverside Vineyard" />
            </Field>
            <div className="md:col-span-2">
              <Field label="How many guests are expected at your event?">
                <input type="text" value={form.expectedGuests} onChange={set('expectedGuests')}
                  className="input-field" placeholder="e.g. 150" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Venue Access & Location ── */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-1">Venue Access & Location</h3>
          <p className="text-dark-500 text-sm mb-4">
            This helps us prepare the right equipment for your event.
          </p>
          <div className="space-y-4">
            <Field label="Do you have water access at your venue?">
              <input type="text" value={form.waterAccess} onChange={set('waterAccess')}
                className="input-field"
                placeholder="e.g. Yes — outdoor spigot near the barn" />
            </Field>
            <Field label="Do you have power access at your venue?">
              <input type="text" value={form.powerAccess} onChange={set('powerAccess')}
                className="input-field"
                placeholder="e.g. Yes — standard 110V outlet, or No — generator only" />
            </Field>
            <Field label="What is the venue address?">
              <input type="text" value={form.locationAddress} onChange={set('locationAddress')}
                className="input-field"
                placeholder="Full delivery address where the trailer should be dropped off" />
            </Field>
            <Field label="Additional address details or notes about the location">
              <textarea value={form.addressDetails} onChange={set('addressDetails')}
                className="input-field min-h-[80px] resize-none"
                placeholder="e.g. Enter through the main gate on Oak Rd, park on the grass near the pavilion..." />
            </Field>
          </div>
        </div>

        {/* ── Additional Questions ── */}
        <div className="card">
          <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Anything Else?</h3>
          <Field label="Do you have any questions or anything else you would like to share with us?">
            <textarea value={form.notes} onChange={set('notes')}
              className="input-field min-h-[100px] resize-none"
              placeholder="Ask us anything — we're happy to help make your event perfect." />
          </Field>
        </div>

        {/* ── Pricing summary ── */}
        <div className="card bg-dark-800 text-white">
          <h3 className="font-serif text-lg font-bold text-gold-400 mb-4">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-cream-300">
              <span>Trailer Rental (1 day)</span>
              <span>$1,100.00</span>
            </div>
            <div className="border-t border-dark-600 pt-2">
              <div className="flex justify-between text-gold-400 font-bold text-lg">
                <span>Deposit Due Today (50%)</span><span>$550.00</span>
              </div>
              <div className="flex justify-between text-cream-400 text-sm mt-1">
                <span>Balance Due at Delivery</span><span>$550.00</span>
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

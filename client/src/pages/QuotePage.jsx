import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary',
  'Graduation', 'Outdoor Festival', 'Charity Gala', 'Private Party', 'Other'
];

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="text-dark-400 text-xs mb-1">{hint}</p>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function QuotePage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', eventType: '',
    requestedStart: '', requestedEnd: '', numTrailers: '1',
    location: '', locationAddress: '', addressDetails: '',
    estimatedGuests: '', waterAccess: '', powerAccess: '', notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.requestedStart) errs.requestedStart = 'Start date is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/quotes', { ...form, numTrailers: parseInt(form.numTrailers) });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Navbar />
        <div className="pt-20 min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center w-full">
            <div className="card-luxury overflow-hidden">
              <div className="bg-dark-gradient p-10">
                <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✉</span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-white mb-2">Quote Request Sent!</h2>
                <p className="text-cream-300">We'll be in touch within 1–2 business days.</p>
              </div>
              <div className="p-8">
                <p className="text-dark-600 mb-6">
                  Thank you, <strong>{form.name}</strong>! We've received your request and will
                  follow up at <strong>{form.email}</strong>.
                </p>
                <div className="flex flex-col gap-3">
                  <Link to="/" className="btn-gold block text-center">Return Home</Link>
                  <Link to="/book" className="btn-outline block text-center">Book a Standard Date</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Header */}
        <div className="bg-dark-800 py-16 px-6 text-center">
          <p className="text-gold-400 text-sm tracking-widest uppercase mb-3">Multi-Day & Custom Events</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Request a Custom Quote
          </h1>
          <p className="text-cream-300 text-lg max-w-xl mx-auto">
            Planning a multi-day event, need both trailers, or have special requirements?
            Fill out the form and we'll craft a custom quote for you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Contact Info ── */}
            <div className="card">
              <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name *" error={errors.name}>
                  <input type="text" value={form.name} onChange={set('name')}
                    className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                    placeholder="Jane Smith" />
                </Field>
                <Field label="Email Address *" error={errors.email}>
                  <input type="email" value={form.email} onChange={set('email')}
                    className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="jane@example.com" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Phone Number *" error={errors.phone}>
                    <input type="tel" value={form.phone} onChange={set('phone')}
                      className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                      placeholder="(360) 555-0000" />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Event Info ── */}
            <div className="card">
              <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Event Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Event Type">
                  <select value={form.eventType} onChange={set('eventType')} className="input-field">
                    <option value="">Select type...</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Number of Trailers">
                  <select value={form.numTrailers} onChange={set('numTrailers')} className="input-field">
                    <option value="1">1 Trailer</option>
                    <option value="2">2 Trailers (both units)</option>
                  </select>
                </Field>
                <Field label="Event Start Date *" error={errors.requestedStart}>
                  <input type="date" value={form.requestedStart} onChange={set('requestedStart')}
                    className={`input-field ${errors.requestedStart ? 'border-red-400' : ''}`}
                    min={new Date().toISOString().split('T')[0]} />
                </Field>
                <Field label="Event End Date (if multi-day)">
                  <input type="date" value={form.requestedEnd} onChange={set('requestedEnd')}
                    className="input-field"
                    min={form.requestedStart || new Date().toISOString().split('T')[0]} />
                </Field>
                <Field label="Venue / Location Name">
                  <input type="text" value={form.location} onChange={set('location')}
                    className="input-field" placeholder="e.g. Smith Family Farm" />
                </Field>
                <Field label="How many guests are expected at your event?">
                  <input type="text" value={form.estimatedGuests} onChange={set('estimatedGuests')}
                    className="input-field" placeholder="e.g. 200" />
                </Field>
              </div>
            </div>

            {/* ── Venue Access & Location ── */}
            <div className="card">
              <h3 className="font-serif text-lg font-bold text-dark-800 mb-1">Venue Access & Location</h3>
              <p className="text-dark-500 text-sm mb-4">This helps us plan the right setup for your event.</p>
              <div className="space-y-4">
                <Field label="Do you have water access at your venue?">
                  <input type="text" value={form.waterAccess} onChange={set('waterAccess')}
                    className="input-field"
                    placeholder="e.g. Yes — outdoor spigot near the barn" />
                </Field>
                <Field label="Do you have power access at your venue?">
                  <input type="text" value={form.powerAccess} onChange={set('powerAccess')}
                    className="input-field"
                    placeholder="e.g. Yes — standard 110V outlet, or No — generator available" />
                </Field>
                <Field label="What is the venue address?">
                  <input type="text" value={form.locationAddress} onChange={set('locationAddress')}
                    className="input-field"
                    placeholder="Full street address of the event location" />
                </Field>
                <Field label="Additional address details or notes about the location">
                  <textarea value={form.addressDetails} onChange={set('addressDetails')}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="e.g. Enter through the main gate on Oak Rd, park near the pavilion..." />
                </Field>
              </div>
            </div>

            {/* ── Anything else ── */}
            <div className="card">
              <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Anything Else?</h3>
              <Field label="Do you have any questions or anything else you would like to share with us?">
                <textarea value={form.notes} onChange={set('notes')}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Tell us more about your event or ask any questions you have." />
              </Field>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full text-lg py-4">
              {loading ? 'Submitting...' : 'Submit Quote Request'}
            </button>
            <p className="text-center text-dark-500 text-sm">
              Or book a standard single-day event at{' '}
              <Link to="/book" className="text-gold-600 hover:underline">Book Now</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

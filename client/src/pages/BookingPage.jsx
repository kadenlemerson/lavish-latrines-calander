import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BookingCalendar from '../components/BookingCalendar';
import BookingForm from '../components/BookingForm';
import PaymentAndSign from '../components/PaymentAndSign';

const STEPS = ['Select Date', 'Event Details', 'Payment & Sign'];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState(null);
  const [booking, setBooking] = useState(null);

  function handleDateSelect(date) {
    setSelectedDate(date);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFormSubmit(data) {
    setFormData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBookingComplete(b) {
    setBooking(b);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Header */}
        <div className="bg-dark-800 py-16 px-6 text-center">
          <p className="text-gold-400 text-sm tracking-widest uppercase mb-3">Reserve Your Date</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Book a Lavish Latrines Trailer
          </h1>
          <p className="text-cream-300 text-lg max-w-xl mx-auto">
            Luxury restroom trailers starting at $1,100/day. 50% deposit required.
          </p>
        </div>

        {/* Progress steps */}
        {step < 3 && (
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
            <div className="flex items-center justify-center gap-0">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      i < step ? 'bg-gold-500 text-dark-800'
                      : i === step ? 'bg-dark-800 text-gold-400 ring-2 ring-gold-400'
                      : 'bg-cream-200 text-dark-400'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 font-medium hidden sm:block ${
                      i === step ? 'text-dark-800' : 'text-dark-400'
                    }`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-1 transition-all ${
                      i < step ? 'bg-gold-500' : 'bg-cream-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Step 0: Calendar */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-dark-800 mb-2 text-center">
                Choose Your Event Date
              </h2>
              <p className="text-dark-500 text-center mb-8">
                Select an available date. Greyed-out dates are fully booked.
              </p>
              <BookingCalendar onSelectDate={handleDateSelect} />
            </div>
          )}

          {/* Step 1: Event Details Form */}
          {step === 1 && selectedDate && (
            <div>
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-2 text-dark-500 hover:text-gold-600 mb-6 text-sm font-medium transition-colors"
              >
                ← Back to Calendar
              </button>
              <BookingForm
                selectedDate={selectedDate}
                onSubmit={handleFormSubmit}
              />
            </div>
          )}

          {/* Step 2: Payment & Signature */}
          {step === 2 && formData && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-dark-500 hover:text-gold-600 mb-6 text-sm font-medium transition-colors"
              >
                ← Back to Details
              </button>
              <PaymentAndSign
                selectedDate={selectedDate}
                formData={formData}
                onComplete={handleBookingComplete}
              />
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && booking && (
            <div className="max-w-lg mx-auto text-center">
              <div className="card-luxury overflow-hidden">
                <div className="bg-dark-gradient p-10">
                  <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-white mb-2">
                    Booking Confirmed!
                  </h2>
                  <p className="text-cream-300">Reference: <span className="text-gold-400 font-bold">#LL-{String(booking.id).padStart(4, '0')}</span></p>
                </div>
                <div className="p-8 bg-white">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between py-3 border-b border-cream-200">
                      <span className="text-dark-500">Event Date</span>
                      <span className="font-semibold text-dark-800">{formatDateDisplay(booking.event_date)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-cream-200">
                      <span className="text-dark-500">Trailer</span>
                      <span className="font-semibold text-dark-800">Unit #{booking.trailer_number}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-cream-200">
                      <span className="text-dark-500">Deposit Paid</span>
                      <span className="font-semibold text-green-600">${booking.deposit_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-dark-500">Balance Due</span>
                      <span className="font-semibold text-dark-800">${booking.balance_due?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gold-50 rounded-lg border border-gold-200">
                    <p className="text-gold-700 text-sm text-center">
                      📧 A confirmation email and invoice have been sent to your inbox.
                    </p>
                  </div>
                  <p className="text-dark-500 text-sm text-center mt-4">
                    The balance of <strong>${booking.balance_due?.toFixed(2)}</strong> is due at delivery.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <Link to="/" className="btn-gold block text-center">
                      Return Home
                    </Link>
                    <Link to="/book" className="btn-outline block text-center">
                      Book Another Date
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

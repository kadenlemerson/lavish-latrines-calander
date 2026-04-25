import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const steps = [
  {
    number: '01',
    title: 'Choose Your Date',
    desc: 'Browse our availability calendar and select an open date for your event. Dates turn grey when both trailers are booked.',
    icon: '📅'
  },
  {
    number: '02',
    title: 'Tell Us About Your Event',
    desc: 'Share your event type, expected guest count, venue name, and delivery address. We also ask about water and power access so we can plan the right setup.',
    icon: '📋'
  },
  {
    number: '03',
    title: 'Pay Your Deposit & Sign',
    desc: 'Pay your 50% deposit ($550) securely via Square. Then sign your rental agreement digitally — no paperwork required.',
    icon: '✍'
  },
  {
    number: '04',
    title: 'We Handle Everything',
    desc: 'We deliver and set up your trailer the day before your event and pick it up the day after. All you do is enjoy your party.',
    icon: '✦'
  }
];

const logistics = [
  {
    icon: '💧',
    title: 'Water Supply',
    detail: 'We bring a 100 ft water hose.',
    body: "You just need a standard outdoor spigot — the exact distance can vary depending on where your spigot is located and what hose attachments you have available. We'll bring our own 100 ft hose and handle all the connections, or if you already have one hooked up we're happy to use that instead. If you need additional reach beyond what we provide, you're welcome to supply your own extension hose and we'll take care of the rest."
  },
  {
    icon: '⚡',
    title: 'Power Supply',
    detail: 'We bring a 50 ft extension cord.',
    body: "You'll need a standard 110V outdoor outlet — the distance can vary since extension cords can always be added. We bring one 50 ft extension cord, so if your outlet is further away you're welcome to supply additional extension cords and we'll get everything connected. A single 15-amp household circuit can run the lights plus either the hot water or the air conditioning — but not all three at once. For the full experience with everything running simultaneously, we recommend two separate outlets on different circuits, or a single dedicated 20-amp circuit. If you're unsure what your venue has, just let us know and we'll help you figure it out!"
  },
  {
    icon: '🚚',
    title: 'Delivery & Pickup',
    detail: 'Drop-off the day before, pickup the day after.',
    body: 'We deliver and set up your trailer the day before your event so it\'s ready when your guests arrive. We return to pick it up the day after your event. Special arrangements (same-day delivery, early pickup) are available — just let us know in your booking notes.'
  },
  {
    icon: '📍',
    title: 'Placement & Access',
    detail: 'Level ground, clear path required.',
    body: 'The trailer needs a reasonably flat, firm surface and clear vehicle access for delivery. If your venue has a gate code, gravel driveway, or tricky access, share those details in the address notes when you book so our driver is fully prepared.'
  }
];

const faqs = [
  {
    q: 'How far in advance should I book?',
    a: 'We recommend booking at least 4–6 weeks before your event, especially for weekends and peak summer dates. However, we do sometimes have last-minute availability — check the calendar and reach out if you\'re in a pinch.'
  },
  {
    q: 'What\'s included in the rental?',
    a: 'Everything: delivery, setup, breakdown, pickup, a fully stocked trailer (toilet paper, hand soap, paper towels, air freshener), and a clean unit on arrival. We handle all the logistics so you don\'t have to.'
  },
  {
    q: 'Can I book both trailers?',
    a: 'Yes! For large events (150+ guests) or if you simply want extra capacity, we can provide both trailers. Use the "Request a Quote" form to get a custom package price.'
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Cancellations 14+ days before the event receive a full deposit refund. Cancellations 7–13 days out receive a 50% refund. No refund for cancellations within 7 days of the event.'
  },
  {
    q: 'What if my venue doesn\'t have water or power?',
    a: 'Give us a heads up when you book. We can discuss generator options and fresh-water tank arrangements for venues without hookups. Just note it in your booking form and we\'ll follow up.'
  },
  {
    q: 'Do you service areas outside Vancouver, WA?',
    a: 'Yes — we serve the broader Portland Metro area including Clark County and Multnomah County. For events further afield, reach out via the quote form and we\'ll let you know if a travel fee applies.'
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      {/* Header */}
      <div className="bg-dark-800 pt-32 pb-16 px-6 text-center">
        <p className="text-gold-400 text-sm tracking-widest uppercase mb-3">The Process</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
          How It Works
        </h1>
        <p className="text-cream-300 text-lg max-w-xl mx-auto">
          Everything you need to know about booking Lavish Latrines for your event.
        </p>
      </div>

      {/* Booking steps */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 text-sm tracking-widest uppercase mb-2">Simple Process</p>
            <h2 className="font-serif text-3xl font-bold text-dark-800">Book in 4 Steps</h2>
            <div className="w-12 h-0.5 bg-gold-500 mx-auto mt-3" />
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.number} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-[-calc(50%-2rem)] h-0.5 bg-cream-300" />
                )}
                <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-gold-500 font-serif font-bold text-lg">{s.number}</span>
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-serif font-semibold text-dark-800 text-lg mb-2">{s.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/book" className="btn-gold text-lg px-10 py-4">
              Check Availability
            </Link>
          </div>
        </div>
      </section>

      {/* Logistics details */}
      <section className="py-20 px-6 bg-cream-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 text-sm tracking-widest uppercase mb-2">What to Expect</p>
            <h2 className="font-serif text-3xl font-bold text-dark-800">Logistics & Setup Details</h2>
            <div className="w-12 h-0.5 bg-gold-500 mx-auto mt-3" />
            <p className="text-dark-500 mt-4 max-w-xl mx-auto">
              We make setup easy. Here's exactly what we bring, what you need to provide, and how the day-of process works.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {logistics.map(item => (
              <div key={item.title} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-serif font-bold text-dark-800 text-lg mb-0.5">{item.title}</h3>
                    <p className="text-gold-600 text-sm font-semibold mb-2">{item.detail}</p>
                    <p className="text-dark-500 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Power info callout */}
      <section className="py-12 px-6 bg-dark-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="font-serif text-2xl font-bold text-white mb-3">A Quick Note on Power</h3>
          <p className="text-cream-300 leading-relaxed text-lg">
            On a <strong className="text-gold-400">standard 10-amp household circuit</strong>, our trailer can run
            the hot water heater <em>or</em> the air conditioning — but not both at the same time.
            If your venue has a <strong className="text-gold-400">dedicated 20-amp outlet or a trailer hookup</strong>,
            we can run hot water and AC simultaneously for the full luxury experience.
            Not sure what your venue has? Just let us know when you book and we'll figure it out together.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 text-sm tracking-widest uppercase mb-2">Common Questions</p>
            <h2 className="font-serif text-3xl font-bold text-dark-800">FAQ</h2>
            <div className="w-12 h-0.5 bg-gold-500 mx-auto mt-3" />
          </div>
          <div className="space-y-4">
            {faqs.map(item => (
              <div key={item.q} className="card">
                <h4 className="font-serif font-bold text-dark-800 mb-2">{item.q}</h4>
                <p className="text-dark-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-dark-800 text-center">
        <h2 className="font-serif text-3xl font-bold text-white mb-4">Ready to Reserve Your Date?</h2>
        <p className="text-cream-300 text-lg mb-8 max-w-xl mx-auto">
          Check availability and book online in minutes. Your 50% deposit holds the date.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/book" className="btn-gold text-lg px-10 py-4">Book Now</Link>
          <Link to="/quote" className="btn-outline text-lg px-10 py-4 border-cream-300 text-cream-200 hover:bg-cream-200 hover:text-dark-800">
            Request a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
}

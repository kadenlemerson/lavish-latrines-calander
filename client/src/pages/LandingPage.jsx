import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-dark-800">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative text-center px-6 max-w-5xl mx-auto">
          <p className="text-gold-500 text-sm tracking-[0.3em] uppercase font-medium mb-6">
            Vancouver, WA · Est. 2024
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            The Luxury Restroom<br />
            <span className="shimmer">Experience</span><br />
            Your Event Deserves
          </h1>
          <p className="text-cream-300 text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Premium portable restroom trailers for weddings, galas, corporate events,
            and private parties across the Pacific Northwest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="btn-gold text-center text-lg px-10 py-4">
              Book Your Date
            </Link>
            <Link to="/quote" className="btn-outline text-center text-lg px-10 py-4 border-cream-300 text-cream-200 hover:bg-cream-200 hover:text-dark-800">
              Request a Quote
            </Link>
          </div>
          <p className="text-dark-400 text-sm mt-8">
            Starting at <span className="text-gold-500 font-semibold">$1,100</span> · 50% deposit to hold your date
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dark-500">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gold-500 to-transparent" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-sm tracking-widest uppercase mb-3">Why Choose Us</p>
            <h2 className="section-title">Luxury Without Compromise</h2>
            <div className="gold-rule mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '✦',
                title: 'White-Glove Service',
                desc: 'Fully stocked trailers delivered, set up, and serviced by our professional team. We handle every detail.'
              },
              {
                icon: '🏆',
                title: 'Premium Fixtures',
                desc: 'Climate-controlled interiors with hardwood floors, granite counters, real flush toilets, and premium amenities.'
              },
              {
                icon: '📅',
                title: 'Easy Booking',
                desc: 'Book online in minutes with our seamless reservation system. Pay your deposit securely and get instant confirmation.'
              },
              {
                icon: '✍',
                title: 'Digital Contracts',
                desc: 'Sign your rental agreement digitally during checkout. No paperwork, no delays.'
              },
              {
                icon: '🔒',
                title: 'Secure Payments',
                desc: 'Pay your deposit safely via Square. Your financial information is always protected.'
              },
              {
                icon: '📧',
                title: 'Instant Invoicing',
                desc: 'Receive your invoice and booking confirmation immediately after checkout via email.'
              }
            ].map(f => (
              <div key={f.title} className="card hover:shadow-md transition-shadow duration-300">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-serif text-xl font-semibold text-dark-800 mb-2">{f.title}</h3>
                <p className="text-dark-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-cream-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold-500 text-sm tracking-widest uppercase mb-3">Simple Pricing</p>
          <h2 className="section-title">Transparent & Fair</h2>
          <div className="gold-rule mx-auto" />
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="card-luxury">
              <div className="bg-dark-gradient p-8 text-center">
                <p className="text-gold-500 text-sm tracking-widest uppercase mb-2">Standard Booking</p>
                <div className="text-5xl font-bold text-white mb-1">$1,100</div>
                <p className="text-cream-300">per trailer · per day</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 text-dark-600">
                  {[
                    'Full-day rental (8am – 11pm)',
                    'Delivery & setup included',
                    'Professional attendant available',
                    'Premium supplies stocked',
                    '50% deposit to reserve',
                    'Balance due at delivery'
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-gold-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/book" className="btn-gold block text-center mt-8">
                  Book Now
                </Link>
              </div>
            </div>
            <div className="card-luxury">
              <div className="bg-gold-gradient p-8 text-center">
                <p className="text-dark-800 text-sm tracking-widest uppercase font-semibold mb-2">Custom Quote</p>
                <div className="text-5xl font-bold text-dark-800 mb-1">Custom</div>
                <p className="text-dark-700">multi-day · both trailers</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 text-dark-600">
                  {[
                    'Multi-day events',
                    'Both trailers (2 unit packages)',
                    'Weddings & galas',
                    'Corporate events',
                    'Weekend packages',
                    'Custom service schedules'
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-gold-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/quote" className="btn-dark block text-center mt-8">
                  Request Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-sm tracking-widest uppercase mb-3">The Process</p>
            <h2 className="section-title">Book in 4 Simple Steps</h2>
            <div className="gold-rule mx-auto" />
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Choose a Date', desc: 'Browse our calendar and select your available event date.' },
              { step: '02', title: 'Share Details', desc: 'Tell us about your event type, location, and any special requirements.' },
              { step: '03', title: 'Pay & Sign', desc: 'Pay your 50% deposit securely and sign the rental contract digitally.' },
              { step: '04', title: 'We\'ll Handle It', desc: 'We deliver, set up, and ensure everything is perfect for your event.' }
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold-500 font-serif font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="font-serif font-semibold text-dark-800 text-lg mb-2">{s.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="btn-gold text-lg px-10 py-4">
              Check Availability
            </Link>
            <Link to="/how-it-works" className="btn-outline text-lg px-10 py-4">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-dark-800 text-center">
        <h2 className="font-serif text-4xl font-bold text-white mb-4">
          Ready to Elevate Your Event?
        </h2>
        <p className="text-cream-300 text-lg mb-8 max-w-xl mx-auto">
          Serving weddings, corporate events, outdoor galas, and private parties across Vancouver, WA and surrounding areas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/book" className="btn-gold text-lg px-10 py-4">
            Book Your Date
          </Link>
          <Link to="/quote" className="btn-outline text-lg px-10 py-4 border-cream-300 text-cream-200 hover:bg-cream-200 hover:text-dark-800">
            Get a Custom Quote
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900 text-dark-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-serif text-gold-500 text-xl font-bold mb-3">LAVISH LATRINES</h3>
              <p className="text-sm leading-relaxed">
                Luxury portable restroom trailer rentals for discerning clients across Vancouver, WA and the Pacific Northwest.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/book" className="hover:text-gold-500 transition-colors">Book a Date</Link></li>
                <li><Link to="/how-it-works" className="hover:text-gold-500 transition-colors">How It Works</Link></li>
                <li><Link to="/quote" className="hover:text-gold-500 transition-colors">Request a Quote</Link></li>
                <li><Link to="/login" className="hover:text-gold-500 transition-colors">Staff Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Service Area</h4>
              <p className="text-sm">Vancouver, WA &amp; Portland Metro</p>
              <p className="text-sm mt-1">Clark County · Multnomah County</p>
              <p className="text-sm mt-1">Surrounding areas upon request</p>
            </div>
          </div>
          <div className="border-t border-dark-700 pt-6 text-center text-sm">
            <p>© {new Date().getFullYear()} Lavish Latrines. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

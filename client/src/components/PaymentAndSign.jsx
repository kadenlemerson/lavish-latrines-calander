import React, { useState, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import api from '../api';

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

const CONTRACT_TEXT = `LAVISH LATRINES RENTAL AGREEMENT

This Rental Agreement ("Agreement") is entered into between Lavish Latrines ("Company") and the Client identified below.

1. RENTAL TERMS
The Company agrees to provide luxury portable restroom trailer rental services for the date(s) specified in this booking. The base rental fee is $1,100 per trailer per day.

2. DEPOSIT & PAYMENT
A 50% deposit ($550) is required to confirm the reservation. The remaining balance is due upon delivery. Failure to pay the balance will result in the trailer not being deployed.

3. CANCELLATION POLICY
Cancellations made 14+ days before the event receive a full deposit refund. Cancellations within 7-13 days receive a 50% deposit refund. No refund for cancellations within 7 days of the event.

4. CLIENT RESPONSIBILITIES
The Client is responsible for providing clear, safe, and accessible delivery location. The Client agrees not to misuse or damage the equipment. Any damage caused by the Client or their guests will be billed at repair/replacement cost.

5. DELIVERY & SETUP
The Company will deliver and set up the trailer before the event start time and will retrieve it after the event. Exact delivery windows will be coordinated prior to the event.

6. INDEMNIFICATION
The Client agrees to indemnify and hold harmless Lavish Latrines from any claims arising from the Client's use of the rental equipment, except where caused by Company negligence.

7. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions.

By signing below, the Client acknowledges they have read, understood, and agree to all terms of this Agreement.`;

export default function PaymentAndSign({ selectedDate, formData, onComplete }) {
  const [squareConfig, setSquareConfig] = useState(null); // null = not yet loaded
  const [squareCard, setSquareCard] = useState(null);
  const [squareReady, setSquareReady] = useState(false);
  const [squareError, setSquareError] = useState('');
  const [contractRead, setContractRead] = useState(false);
  const [signed, setSigned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const cardContainerRef = useRef(null);
  const sigPadInstance = useRef(null);
  const squareCardRef = useRef(null); // keep in sync with state for async access

  // Fetch Square config from server, then load the correct SDK version
  useEffect(() => {
    api.get('/payments/config').then(r => {
      setSquareConfig(r.data);
      if (r.data.configured) {
        loadSquareSdk(r.data);
      } else {
        setSquareReady(true); // no Square — skip payment
      }
    }).catch(() => {
      setSquareReady(true); // can't reach server — skip gracefully
    });
  }, []);

  function loadSquareSdk(config) {
    // Use the correct SDK URL for the environment
    const sdkUrl = config.environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

    // If already loaded (e.g., HMR / navigating back to this page), init directly
    if (window.Square) {
      initSquareCard(config);
      return;
    }

    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => initSquareCard(config);
    script.onerror = () => {
      setSquareError('Could not load the Square payment SDK. Check your internet connection and try again.');
      setSquareReady(true);
    };
    document.head.appendChild(script);
  }

  async function initSquareCard(config) {
    try {
      const payments = window.Square.payments(config.appId, config.locationId);
      const card = await payments.card();
      await card.attach('#square-card-container');
      squareCardRef.current = card;
      setSquareCard(card);
      setSquareReady(true);
    } catch (e) {
      setSquareError('Payment form could not be initialized: ' + e.message);
      setSquareReady(true);
    }
  }

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && !sigPadInstance.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: '#1a1a1a',
        minWidth: 1,
        maxWidth: 3
      });
      sigPadInstance.current = pad;
      setSigPad(pad);

      pad.addEventListener('endStroke', () => {
        setSigned(!pad.isEmpty());
      });

      // Handle resize
      function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const data = pad.toData();
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        pad.fromData(data);
      }
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  function clearSignature() {
    sigPadInstance.current?.clear();
    setSigned(false);
  }

  async function handleSubmit() {
    if (!signed) { setError('Please sign the contract before submitting.'); return; }
    setError('');
    setProcessing(true);

    try {
      // Re-check availability before charging the card
      const availRes = await api.get(`/bookings/availability?date=${selectedDate}`);
      if (!availRes.data.available) {
        setError('Sorry — this date was just booked by someone else. Please go back and choose a different date.');
        setProcessing(false);
        return;
      }

      let squarePaymentId = null;
      const card = squareCardRef.current;

      // Process payment if Square is configured and card form is ready
      if (squareConfig?.configured && card) {
        const tokenResult = await card.tokenize();
        if (tokenResult.status !== 'OK') {
          setError('Payment failed: ' + (tokenResult.errors?.[0]?.message || 'Card error'));
          setProcessing(false);
          return;
        }

        const payRes = await api.post('/payments/create', {
          sourceId: tokenResult.token,
          amount: 550,
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          bookingDate: selectedDate
        });
        squarePaymentId = payRes.data.paymentId;
      }

      // Get signature data
      const signatureData = sigPadInstance.current.toDataURL('image/png');

      // Create booking
      const bookingRes = await api.post('/bookings', {
        ...formData,
        eventDate: selectedDate,
        squarePaymentId,
        signatureData,
        depositAmount: 550
      });

      onComplete(bookingRes.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'An error occurred';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <div className="card bg-dark-800 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-bold text-gold-400">Booking Summary</h3>
          <span className="badge-gold">{formatDateDisplay(selectedDate)}</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-cream-400">Name</span>
          <span className="text-white">{formData.customerName}</span>
          <span className="text-cream-400">Email</span>
          <span className="text-white">{formData.customerEmail}</span>
          <span className="text-cream-400">Event Type</span>
          <span className="text-white">{formData.eventType}</span>
          <span className="text-cream-400">Venue</span>
          <span className="text-white">{formData.location}</span>
        </div>
        <div className="border-t border-dark-600 mt-4 pt-4 flex justify-between items-center">
          <span className="text-cream-400">Deposit Due Today</span>
          <span className="text-gold-400 font-bold text-2xl">$550.00</span>
        </div>
      </div>

      {/* Payment */}
      <div className="card">
        <h3 className="font-serif text-lg font-bold text-dark-800 mb-1">Secure Payment</h3>

        {/* Config not yet loaded */}
        {squareConfig === null && (
          <div className="flex items-center gap-2 text-dark-500 text-sm py-4">
            <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            Loading payment settings...
          </div>
        )}

        {/* Square not configured */}
        {squareConfig !== null && !squareConfig.configured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-semibold mb-1">Payment not yet active</p>
            <p>Square credentials are not fully configured on the server. Your booking will be created and we will contact you to collect payment.</p>
            {squareConfig.missingVars && (
              <p className="mt-2 text-xs font-mono text-amber-700">Missing: {squareConfig.missingVars.join(', ')}</p>
            )}
          </div>
        )}

        {/* Square configured — show card form or loading/error state */}
        {squareConfig !== null && squareConfig.configured && (
          <>
            <p className="text-dark-500 text-sm mb-4">
              Your 50% deposit of $550.00 will be charged securely via Square.
            </p>
            {squareError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {squareError}
              </div>
            ) : !squareReady ? (
              <div className="flex items-center gap-2 text-dark-500 text-sm py-4">
                <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                Loading secure payment form...
              </div>
            ) : (
              <div id="square-card-container" ref={cardContainerRef}
                className="border border-cream-300 rounded-lg p-4 min-h-[100px]" />
            )}
          </>
        )}

        <p className="text-xs text-dark-400 mt-3 flex items-center gap-1">
          <span>🔒</span> Payments are encrypted and secured by Square.
        </p>
      </div>

      {/* Contract */}
      <div className="card">
        <h3 className="font-serif text-lg font-bold text-dark-800 mb-1">Rental Agreement</h3>
        <p className="text-dark-500 text-sm mb-4">Please read the contract below, then sign digitally.</p>
        <div className="bg-cream-50 border border-cream-200 rounded-lg p-4 h-48 overflow-y-auto text-sm text-dark-600 leading-relaxed whitespace-pre-line font-mono text-xs"
          onScroll={e => {
            const el = e.target;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) setContractRead(true);
          }}>
          {CONTRACT_TEXT}
        </div>
        {!contractRead && (
          <p className="text-xs text-amber-600 mt-2">↓ Scroll to the bottom of the contract to continue</p>
        )}
      </div>

      {/* Signature */}
      <div className={`card transition-opacity ${contractRead ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-bold text-dark-800">Digital Signature</h3>
          <button onClick={clearSignature} className="text-xs text-dark-400 hover:text-dark-600 underline">
            Clear
          </button>
        </div>
        <p className="text-dark-500 text-sm mb-3">
          Sign below to acknowledge you have read and agree to the rental agreement.
        </p>
        <div className="border-2 border-cream-300 rounded-lg overflow-hidden bg-white relative"
          style={{ height: 140 }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
          {!signed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-cream-400 text-sm font-serif italic">Sign here...</p>
            </div>
          )}
        </div>
        <p className="text-xs text-dark-400 mt-1">
          {formData.customerName} · {formatDateDisplay(selectedDate)}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={processing || !signed || !contractRead}
        className={`w-full text-lg py-4 rounded-lg font-semibold transition-all ${
          processing || !signed || !contractRead
            ? 'bg-cream-200 text-dark-400 cursor-not-allowed'
            : 'btn-gold'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-dark-800 border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Complete Booking & Pay $550 Deposit`
        )}
      </button>
      <p className="text-xs text-dark-400 text-center">
        By completing this booking you agree to the rental agreement above.
      </p>
    </div>
  );
}

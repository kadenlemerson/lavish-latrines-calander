import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/staff');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-6">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #5868ff 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-3xl font-bold text-gold-400 tracking-wider hover:text-gold-300 transition-colors">
            LAVISH LATRINES
          </Link>
          <p className="text-cream-400 text-sm mt-2 tracking-wider">STAFF PORTAL</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gold-gradient p-6 text-center">
            <h2 className="font-serif text-2xl font-bold text-dark-800">Welcome Back</h2>
            <p className="text-dark-700 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@lavishlatrines.com"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-dark w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="px-8 pb-6">
            <div className="bg-cream-50 rounded-lg p-4 text-xs text-dark-500 border border-cream-200">
              <p className="font-semibold text-dark-700 mb-2">Default Credentials:</p>
              <p>Admin: <span className="font-mono">admin@lavishlatrines.com</span> / <span className="font-mono">admin123</span></p>
              <p className="mt-1">Staff: <span className="font-mono">staff@lavishlatrines.com</span> / <span className="font-mono">staff123</span></p>
              <p className="mt-2 text-amber-600">⚠ Change these passwords immediately in production.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-cream-500 text-sm mt-6">
          <Link to="/" className="hover:text-gold-400 transition-colors">← Back to Main Site</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const { user } = useAuth();

  function load() {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'employee' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id) {
    if (!confirm('Delete this staff account?')) return;
    await api.delete(`/users/${id}`);
    load();
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    }
  }

  return (
    <div className="space-y-6">
      {/* Staff accounts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-dark-800">Staff Accounts</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold text-sm py-2 px-4">
            + Add Staff
          </button>
        </div>

        {showForm && (
          <form onSubmit={createUser} className="bg-cream-50 p-4 rounded-lg mb-4 space-y-3">
            <h4 className="font-medium text-dark-800">New Staff Account</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="input-field" required placeholder="Full Name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  className="input-field" required placeholder="staff@email.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field" required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="input-field">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-gold text-sm py-2 px-4">
                {saving ? 'Creating...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm py-2 px-4">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-dark-400 text-sm">Loading...</p>
        ) : (
          <div className="divide-y divide-cream-100">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-dark-800 rounded-full flex items-center justify-center text-gold-400 font-bold">
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-dark-800 text-sm">{u.name} {u.id === user?.id && <span className="text-gold-500 text-xs">(you)</span>}</p>
                    <p className="text-dark-400 text-xs">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                  {u.id !== user?.id && (
                    <button onClick={() => deleteUser(u.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="font-serif text-lg font-bold text-dark-800 mb-4">Change Your Password</h3>
        <form onSubmit={changePassword} className="max-w-sm space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="input-field" required />
          </div>
          <div>
            <label className="label">New Password (min 6 characters)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="input-field" required minLength={6} />
          </div>
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">✓ Password changed successfully!</p>}
          <button type="submit" className="btn-dark text-sm py-2 px-6">Update Password</button>
        </form>
      </div>
    </div>
  );
}

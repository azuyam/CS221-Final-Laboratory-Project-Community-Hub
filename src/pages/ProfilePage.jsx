// src/pages/ProfilePage.jsx
import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import ConfirmModal from '../components/ConfirmModal';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showAlert } = useAlert();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function confirmUpdate() {
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      updateUser(res.user);
      setForm((prev) => ({ ...prev, password: '' }));
      setConfirmOpen(false);
      showAlert('success', res.message);
    } catch (err) {
      setConfirmOpen(false);
      showAlert('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="form-card auth-card">
        <h1 style={{ marginBottom: '0.4rem' }}>My Profile</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Role: <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>{user?.role}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>New Password (leave blank to keep current password)</label>
            <input
              type="password"
              className="form-control"
              minLength={6}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Profile Changes
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Profile Update"
        message="Are you sure you want to update your profile information?"
        confirmText="Save Changes"
        loading={submitting}
        onConfirm={confirmUpdate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
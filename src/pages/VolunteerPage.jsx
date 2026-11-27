// src/pages/VolunteerPage.jsx
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Users } from 'lucide-react';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = { title: '', details: '', date: '', slots: 10 };

export default function VolunteerPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const isAdmin = user?.role === 'admin';

  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [submitting, setSubmitting] = useState(false);

  async function fetchActivities(query = search) {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/activities?search=${encodeURIComponent(query)}`);
      setActivities(data);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(act) {
    setEditingId(act._id);
    setForm({
      title: act.title,
      details: act.details,
      date: act.date ? act.date.slice(0, 10) : '',
      slots: act.slots,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    setConfirmState({
      isOpen: true,
      title: editingId ? 'Confirm Update' : 'Confirm New Activity',
      message: editingId
        ? `Save changes to volunteer activity "${form.title}"?`
        : `Create volunteer activity "${form.title}"?`,
      confirmText: editingId ? 'Update Activity' : 'Save Activity',
      danger: false,
      action: async () => {
        if (editingId) {
          const res = await apiFetch(`/api/activities/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        } else {
          const res = await apiFetch('/api/activities', {
            method: 'POST',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        await fetchActivities();
      },
    });
  }

  function handleDelete(act) {
    setConfirmState({
      isOpen: true,
      title: 'Confirm Delete Activity',
      message: `Are you sure you want to delete "${act.title}"?`,
      confirmText: 'Delete',
      danger: true,
      action: async () => {
        const res = await apiFetch(`/api/activities/${act._id}`, { method: 'DELETE' });
        showAlert('success', res.message);
        await fetchActivities();
      },
    });
  }

  function handleSignup(act) {
    const leaving = act.hasSignedUp;
    setConfirmState({
      isOpen: true,
      title: leaving ? 'Cancel Volunteer Sign-Up?' : 'Sign Up as Volunteer?',
      message: leaving
        ? `Withdraw your sign-up for "${act.title}"?`
        : `Confirm sign-up to volunteer for "${act.title}"?`,
      confirmText: leaving ? 'Cancel Sign-Up' : 'Sign Up',
      danger: leaving,
      action: async () => {
        const res = await apiFetch(`/api/activities/${act._id}/signup`, {
          method: leaving ? 'DELETE' : 'POST',
        });
        showAlert('success', res.message);
        await fetchActivities();
      },
    });
  }

  async function runConfirmedAction() {
    try {
      setSubmitting(true);
      await confirmState.action();
      setConfirmState({ isOpen: false });
    } catch (err) {
      setConfirmState({ isOpen: false });
      showAlert('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Volunteer Activities</h1>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={17} /> New Activity
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form className="form-card" onSubmit={handleFormSubmit}>
          <h3 style={{ marginBottom: '0.85rem' }}>
            {editingId ? 'Edit Volunteer Activity' : 'Create Volunteer Activity'}
          </h3>
          <div className="form-group">
            <label>Activity Title</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              className="form-control"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Number of Volunteer Slots</label>
            <input
              type="number"
              min="1"
              className="form-control"
              required
              value={form.slots}
              onChange={(e) => setForm({ ...form, slots: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Details</label>
            <textarea
              rows="3"
              className="form-control"
              required
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>
          <div className="card-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Save Activity'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search volunteer activities..."
      />

      {loading ? (
        <p>Loading volunteer activities...</p>
      ) : activities.length === 0 ? (
        <div className="empty-state">No volunteer activities found.</div>
      ) : (
        <div className="card-grid">
          {activities.map((act) => {
            const isFull = act.signupCount >= act.slots;
            return (
              <div key={act._id} className="card">
                <h2 className="card-title">{act.title}</h2>
                <div className="card-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> {formatDate(act.date)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} /> {act.signupCount} / {act.slots} slots taken
                  </span>
                </div>
                <p>{act.details}</p>

                <div className="card-actions">
                  <button
                    type="button"
                    className={`btn ${act.hasSignedUp ? 'btn-outline' : 'btn-primary'}`}
                    disabled={!act.hasSignedUp && isFull}
                    onClick={() => handleSignup(act)}
                  >
                    {act.hasSignedUp
                      ? 'Cancel Sign-Up'
                      : isFull
                      ? 'Slots Full'
                      : 'Sign Up as Volunteer'}
                  </button>

                  {isAdmin && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(act)}>
                        <Pencil size={15} /> Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(act)}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        danger={confirmState.danger}
        loading={submitting}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmState({ isOpen: false })}
      />
    </div>
  );
}
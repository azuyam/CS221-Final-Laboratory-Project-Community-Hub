// src/pages/EventsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = { title: '', details: '', date: '', place: '', maxPeople: 20 };

export default function EventsPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const isAdmin = user?.role === 'admin';

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [submitting, setSubmitting] = useState(false);

  async function fetchEvents(query = search) {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/events?search=${encodeURIComponent(query)}`);
      setEvents(data);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingId(ev._id);
    setForm({
      title: ev.title,
      details: ev.details,
      date: ev.date ? ev.date.slice(0, 10) : '',
      place: ev.place,
      maxPeople: ev.maxPeople,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    setConfirmState({
      isOpen: true,
      title: editingId ? 'Confirm Event Update' : 'Confirm New Event',
      message: editingId
        ? `Save changes to event "${form.title}"?`
        : `Create event "${form.title}"?`,
      confirmText: editingId ? 'Update Event' : 'Save Event',
      danger: false,
      action: async () => {
        if (editingId) {
          const res = await apiFetch(`/api/events/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        } else {
          const res = await apiFetch('/api/events', {
            method: 'POST',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        await fetchEvents();
      },
    });
  }

  function handleDelete(ev) {
    setConfirmState({
      isOpen: true,
      title: 'Confirm Delete Event',
      message: `Are you sure you want to delete "${ev.title}"?`,
      confirmText: 'Delete',
      danger: true,
      action: async () => {
        const res = await apiFetch(`/api/events/${ev._id}`, { method: 'DELETE' });
        showAlert('success', res.message);
        await fetchEvents();
      },
    });
  }

  function handleRsvp(ev) {
    const leaving = ev.hasJoined;
    setConfirmState({
      isOpen: true,
      title: leaving ? 'Leave Event?' : 'Join Event?',
      message: leaving
        ? `Are you sure you want to leave "${ev.title}"?`
        : `Confirm RSVP to join "${ev.title}"?`,
      confirmText: leaving ? 'Leave Event' : 'Join Event',
      danger: leaving,
      action: async () => {
        const res = await apiFetch(`/api/events/${ev._id}/rsvp`, {
          method: leaving ? 'DELETE' : 'POST',
        });
        showAlert('success', res.message);
        await fetchEvents();
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
        <h1>Community Events</h1>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={17} /> New Event
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form className="form-card" onSubmit={handleFormSubmit}>
          <h3 style={{ marginBottom: '0.85rem' }}>
            {editingId ? 'Edit Event' : 'Create Event'}
          </h3>
          <div className="form-group">
            <label>Event Title</label>
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
            <label>Place</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Maximum Number of People</label>
            <input
              type="number"
              min="1"
              className="form-control"
              required
              value={form.maxPeople}
              onChange={(e) => setForm({ ...form, maxPeople: e.target.value })}
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
              {editingId ? 'Update' : 'Save Event'}
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
        placeholder="Search events by title, place, or details..."
      />

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <div className="empty-state">No events found.</div>
      ) : (
        <div className="card-grid">
          {events.map((ev) => {
            const isFull = ev.rsvpCount >= ev.maxPeople;
            return (
              <div key={ev._id} className="card">
                <h2 className="card-title">{ev.title}</h2>
                <div className="card-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> {formatDate(ev.date)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} /> {ev.place}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} /> {ev.rsvpCount} / {ev.maxPeople} joined
                  </span>
                </div>
                <p>{ev.details}</p>

                <div className="card-actions">
                  {user ? (
                    <button
                      type="button"
                      className={`btn ${ev.hasJoined ? 'btn-outline' : 'btn-primary'}`}
                      disabled={!ev.hasJoined && isFull}
                      onClick={() => handleRsvp(ev)}
                    >
                      {ev.hasJoined ? 'Leave Event' : isFull ? 'Event Full' : 'Join Event'}
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-outline">
                      Log in to Join
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(ev)}>
                        <Pencil size={15} /> Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(ev)}>
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
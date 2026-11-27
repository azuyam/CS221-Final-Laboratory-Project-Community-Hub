// src/pages/AnnouncementsPage.jsx
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = { title: '', category: '', message: '' };

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [submitting, setSubmitting] = useState(false);

  async function fetchAnnouncements(query = search) {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/announcements?search=${encodeURIComponent(query)}`);
      setItems(data);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncements(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item._id);
    setForm({ title: item.title, category: item.category, message: item.message });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    setConfirmState({
      isOpen: true,
      title: editingId ? 'Confirm Update' : 'Confirm Create',
      message: editingId
        ? `Save changes to announcement "${form.title}"?`
        : `Post new announcement "${form.title}"?`,
      confirmText: editingId ? 'Update Announcement' : 'Save Announcement',
      danger: false,
      action: async () => {
        if (editingId) {
          const res = await apiFetch(`/api/announcements/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        } else {
          const res = await apiFetch('/api/announcements', {
            method: 'POST',
            body: JSON.stringify(form),
          });
          showAlert('success', res.message);
        }
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        await fetchAnnouncements();
      },
    });
  }

  function handleDelete(item) {
    setConfirmState({
      isOpen: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${item.title}"?`,
      confirmText: 'Delete',
      danger: true,
      action: async () => {
        const res = await apiFetch(`/api/announcements/${item._id}`, { method: 'DELETE' });
        showAlert('success', res.message);
        await fetchAnnouncements();
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
        <h1>Community Announcements</h1>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={17} /> New Announcement
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form className="form-card" onSubmit={handleFormSubmit}>
          <h3 style={{ marginBottom: '0.85rem' }}>
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h3>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Category (e.g., Notice, Health, Safety)</label>
            <input
              type="text"
              className="form-control"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              rows="3"
              className="form-control"
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="card-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Save Announcement'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search announcements by title, category, or message..."
      />

      {loading ? (
        <p>Loading announcements...</p>
      ) : items.length === 0 ? (
        <div className="empty-state">No announcements found.</div>
      ) : (
        <div className="stack">
          {items.map((item) => (
            <div key={item._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 className="card-title">{item.title}</h2>
                <span className="badge">{item.category}</span>
              </div>
              <div className="card-meta">
                <span>Posted: {formatDate(item.datePosted)}</span>
                <span>By: {item.postedBy?.name || 'Community Staff'}</span>
              </div>
              <p>{item.message}</p>

              {isAdmin && (
                <div className="card-actions">
                  <button type="button" className="btn btn-outline" onClick={() => openEdit(item)}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(item)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
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
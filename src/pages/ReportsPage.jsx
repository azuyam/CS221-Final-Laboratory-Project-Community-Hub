// src/pages/ReportsPage.jsx
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = { title: '', category: 'Infrastructure', place: '', details: '' };

function statusBadgeClass(status) {
  if (status === 'In progress') return 'badge badge-progress';
  if (status === 'Resolved') return 'badge badge-resolved';
  return 'badge badge-new';
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchReports(query = search) {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/reports?search=${encodeURIComponent(query)}`);
      setReports(data);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function confirmSaveReport() {
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showAlert('success', res.message);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setConfirmOpen(false);
      await fetchReports();
    } catch (err) {
      setConfirmOpen(false);
      showAlert('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{user?.role === 'admin' ? 'Problem Reports' : 'My Problem Reports'}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <Plus size={17} /> {showForm ? 'Close Form' : 'Report a Problem'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '0.85rem' }}>Submit a Community Problem</h3>
          <div className="form-group">
            <label>Problem Title</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g., Broken streetlight"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="Lighting">Lighting</option>
              <option value="Sanitation">Sanitation & Garbage</option>
              <option value="Water & Drainage">Water & Drainage</option>
              <option value="Safety">Safety</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Place (describe in words)</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g., Corner of Rizal St. near the basketball court"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Details</label>
            <textarea
              rows="3"
              className="form-control"
              required
              placeholder="Describe the issue clearly..."
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>
          <div className="card-actions">
            <button type="submit" className="btn btn-primary">
              Submit Report
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
        placeholder="Search reports by title, category, place, or status..."
      />

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="empty-state">No problem reports found.</div>
      ) : (
        <div className="stack">
          {reports.map((rep) => (
            <div key={rep._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 className="card-title">{rep.title}</h2>
                <span className={statusBadgeClass(rep.status)}>{rep.status}</span>
              </div>
              <div className="card-meta">
                <span>Category: {rep.category}</span>
                <span>Place: {rep.place}</span>
                <span>Date: {formatDate(rep.date)}</span>
              </div>
              <p>{rep.details}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Submit Report"
        message={`Submit problem report "${form.title}"?`}
        confirmText="Submit Report"
        loading={submitting}
        onConfirm={confirmSaveReport}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
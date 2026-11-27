// src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { showAlert } = useAlert();

  const [counts, setCounts] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  const [reportSearch, setReportSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusEdits, setStatusEdits] = useState({});

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [submitting, setSubmitting] = useState(false);

  async function loadDashboard() {
    try {
      const data = await apiFetch('/api/admin/dashboard');
      setCounts(data);
    } catch (err) {
      showAlert('error', err.message);
    }
  }

  async function loadReports(query = reportSearch) {
    try {
      const data = await apiFetch(`/api/reports?search=${encodeURIComponent(query)}`);
      setReports(data);
      const map = {};
      data.forEach((r) => {
        map[r._id] = r.status;
      });
      setStatusEdits(map);
    } catch (err) {
      showAlert('error', err.message);
    }
  }

  async function loadUsers(query = userSearch) {
    try {
      const data = await apiFetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      setUsers(data);
    } catch (err) {
      showAlert('error', err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadReports(reportSearch), 250);
    return () => clearTimeout(timer);
  }, [reportSearch]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(userSearch), 250);
    return () => clearTimeout(timer);
  }, [userSearch]);

  function handleUpdateReportStatus(rep) {
    const nextStatus = statusEdits[rep._id];
    setConfirmState({
      isOpen: true,
      title: 'Confirm Status Update',
      message: `Change status of "${rep.title}" to "${nextStatus}"?`,
      confirmText: 'Update Status',
      danger: false,
      action: async () => {
        const res = await apiFetch(`/api/reports/${rep._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        });
        showAlert('success', res.message);
        await Promise.all([loadDashboard(), loadReports()]);
      },
    });
  }

  function handleToggleAdmin(targetUser) {
    const nextRole = targetUser.role === 'admin' ? 'member' : 'admin';
    setConfirmState({
      isOpen: true,
      title: nextRole === 'admin' ? 'Make User Admin?' : 'Remove Admin Role?',
      message:
        nextRole === 'admin'
          ? `Are you sure you want to make ${targetUser.name} an Admin?`
          : `Change ${targetUser.name} back to a regular Member?`,
      confirmText: nextRole === 'admin' ? 'Make Admin' : 'Set as Member',
      danger: nextRole !== 'admin',
      action: async () => {
        const res = await apiFetch(`/api/admin/users/${targetUser._id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: nextRole }),
        });
        showAlert('success', res.message);
        await loadUsers();
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
        <h1>Admin Dashboard</h1>
      </div>

      {counts && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{counts.users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{counts.announcements}</div>
            <div className="stat-label">Announcements</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{counts.events}</div>
            <div className="stat-label">Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{counts.activities}</div>
            <div className="stat-label">Volunteer Activities</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{counts.reports.total}</div>
            <div className="stat-label">
              Reports ({counts.reports.new} New / {counts.reports.inProgress} In Progress / {counts.reports.resolved} Resolved)
            </div>
          </div>
        </div>
      )}

      <h2 className="section-divider">Manage Problem Reports</h2>
      <SearchBar
        value={reportSearch}
        onChange={setReportSearch}
        placeholder="Search problem reports by title, place, or status..."
      />

      {reports.length === 0 ? (
        <div className="empty-state">No problem reports found.</div>
      ) : (
        <div className="stack">
          {reports.map((rep) => (
            <div key={rep._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="card-title">{rep.title}</h3>
                <span className="badge">{rep.status}</span>
              </div>
              <div className="card-meta">
                <span>Reported by: {rep.reportedBy?.name || 'Member'}</span>
                <span>Place: {rep.place}</span>
                <span>Date: {formatDate(rep.date)}</span>
              </div>
              <p style={{ marginBottom: '0.75rem' }}>{rep.details}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={statusEdits[rep._id] || rep.status}
                  onChange={(e) => setStatusEdits({ ...statusEdits, [rep._id]: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="In progress">In progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={statusEdits[rep._id] === rep.status}
                  onClick={() => handleUpdateReportStatus(rep)}
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-divider">Manage Users</h2>
      <SearchBar
        value={userSearch}
        onChange={setUserSearch}
        placeholder="Search users by name, email, or role..."
      />

      {users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="stack">
          {users.map((u) => {
            const isSelf = u._id === currentUser?.id;
            return (
              <div
                key={u._id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {u.name}{' '}
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{u.email}</div>
                </div>

                {!isSelf && (
                  <button
                    type="button"
                    className={`btn ${u.role === 'admin' ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => handleToggleAdmin(u)}
                  >
                    {u.role === 'admin' ? 'Set as Member' : 'Make Admin'}
                  </button>
                )}
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
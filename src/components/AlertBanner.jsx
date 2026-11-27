// src/components/AlertBanner.jsx
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function AlertBanner() {
  const { alert, clearAlert } = useAlert();
  if (!alert) return null;

  const isSuccess = alert.type === 'success';

  return (
    <div className="alert-wrapper" role="status">
      <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {alert.message}
        </span>
        <button
          onClick={clearAlert}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          aria-label="Close message"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { auditApi } from '../api.ts';
import type { AuditLog } from '@team-tracker/shared';

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' },
  subheading: { fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { background: '#f1f5f9', padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#374151' },
};

function badgeStyle(action: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: action === 'create' ? '#dcfce7' : action === 'update' ? '#dbeafe' : '#fee2e2',
    color: action === 'create' ? '#15803d' : action === 'update' ? '#1d4ed8' : '#b91c1c',
  };
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = () => {
      auditApi
        .list()
        .then(setLogs)
        .catch((err: Error) => setError(err.message));
    };

    fetchLogs();

    // Keep the audit log up to date by polling every 15 seconds
    setInterval(fetchLogs, 15000);
    // Note: cleanup (clearInterval) not returned, so the interval persists across navigations
  }, []);

  if (error) {
    return <p style={{ color: '#ef4444' }}>Failed to load audit log: {error}</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Audit Log</h1>
      <p style={styles.subheading}>All recent activity across your team. Auto-refreshes every 15 seconds.</p>

      {logs.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No activity recorded yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>When</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Entity</th>
              <th style={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={styles.td}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={styles.td}>{log.userName}</td>
                <td style={styles.td}>
                  <span style={badgeStyle(log.action)}>{log.action}</span>
                </td>
                <td style={styles.td}>
                  {log.entityType} #{log.entityId}
                </td>
                <td style={styles.td}>{log.details ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

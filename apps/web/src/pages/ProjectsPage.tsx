import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api.ts';
import type { Project } from '@team-tracker/shared';

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.25rem',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    transition: 'box-shadow 0.15s',
  },
  cardTitle: { fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: '#1e293b' },
  cardDesc: { fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.4 },
  meta: { fontSize: '0.8rem', color: '#94a3b8' },
  empty: { color: '#94a3b8', fontStyle: 'italic' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  // No loading state tracked – the list renders empty while the request is in flight

  useEffect(() => {
    projectsApi
      .list()
      .then(setProjects)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <p style={{ color: '#ef4444' }}>Failed to load projects: {error}</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Your Projects</h1>
      {projects.length === 0 ? (
        <p style={styles.empty}>No projects found.</p>
      ) : (
        <div style={styles.grid}>
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}/tasks`}
              style={styles.card}
            >
              <div style={styles.cardTitle}>{p.name}</div>
              {p.description && (
                <div style={styles.cardDesc}>{p.description}</div>
              )}
              <div style={styles.meta}>
                {(p as Project & { task_count?: number }).task_count ?? 0} tasks ·{' '}
                {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

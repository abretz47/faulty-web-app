import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi, usersApi } from '../api.ts';
import type { Task } from '@team-tracker/shared';
import TaskCard from '../components/TaskCard.tsx';
import TaskForm from '../components/TaskForm.tsx';

type TeamMember = { id: number; name: string; email: string; role: string };

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  heading: { fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', flex: 1 },
  addBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  backLink: { color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },
  column: { background: '#f8fafc', borderRadius: '8px', padding: '1rem' },
  columnTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#475569',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export default function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadTasks = () => {
    if (!projectId) return;
    setLoading(true);
    tasksApi
      .list(Number(projectId))
      .then((data) => {
        // Sort tasks so those with the earliest due date appear first.
        // Tasks without a due date fall back to epoch (Jan 1 1970) so they
        // appear before all dated tasks.
        const sorted = [...data].sort(
          (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        );
        setTasks(sorted);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTasks();
    usersApi.teamMembers().then(setMembers).catch(console.error);
  }, [projectId]);

  const handleStatusChange = async (taskId: number, status: string) => {
    await tasksApi.update(Number(projectId), taskId, { status });
    loadTasks();
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.delete(Number(projectId), taskId);
    loadTasks();
  };

  const handleCreate = async (data: Partial<Task>) => {
    await tasksApi.create(Number(projectId), {
      title: data.title!,
      description: data.description ?? undefined,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ?? null,
    });
    setShowForm(false);
    loadTasks();
  };

  if (loading) return <p>Loading tasks…</p>;
  if (error) return <p style={{ color: '#ef4444' }}>Error: {error}</p>;

  const tasksByStatus = Object.fromEntries(
    Object.keys(STATUS_LABELS).map((s) => [s, tasks.filter((t) => t.status === s)])
  );

  return (
    <div>
      <div style={styles.header}>
        <Link to="/projects" style={styles.backLink}>
          ← Projects
        </Link>
        <h1 style={styles.heading}>Tasks</h1>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          + New Task
        </button>
      </div>

      {showForm && (
        <TaskForm
          members={members}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={styles.columns}>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} style={styles.column}>
            <div style={styles.columnTitle}>
              {label} ({tasksByStatus[status]?.length ?? 0})
            </div>
            {tasksByStatus[status]?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

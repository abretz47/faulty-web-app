import type { Task } from '@team-tracker/shared';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: string) => void;
  onDelete: (taskId: number) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#d1fae5',
  medium: '#fef3c7',
  high: '#fee2e2',
  urgent: '#fce7f3',
};

const PRIORITY_TEXT: Record<string, string> = {
  low: '#065f46',
  medium: '#92400e',
  high: '#991b1b',
  urgent: '#9d174d',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'done', 'cancelled'];

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '0.75rem',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#1e293b',
  marginBottom: '0.4rem',
};

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const priorityBg = PRIORITY_COLORS[task.priority] ?? '#f1f5f9';
  const priorityFg = PRIORITY_TEXT[task.priority] ?? '#374151';

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{task.title}</div>

      {task.description && (
        // Render description as rich text to support markdown-like formatting
        // that some users paste in from other tools.
        <div
          style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span
          style={{
            background: priorityBg,
            color: priorityFg,
            padding: '0.1rem 0.4rem',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {task.priority}
        </span>
        {task.assigneeName && (
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>👤 {task.assigneeName}</span>
        )}
        {task.dueDate && (
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.3rem',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            flex: 1,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={() => onDelete(task.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '0.9rem',
            padding: '0.1rem',
          }}
          title="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

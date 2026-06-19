import { useState } from 'react';
import type { Task } from '@team-tracker/shared';

type TeamMember = { id: number; name: string; email: string; role: string };

interface TaskFormProps {
  members: TeamMember[];
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  initial?: Partial<Task>;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '2rem',
  width: '460px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  marginBottom: '1rem',
};

export default function TaskForm({ members, onSubmit, onCancel, initial }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<Task['status']>(initial?.status ?? 'todo');
  const [priority, setPriority] = useState<Task['priority']>(initial?.priority ?? 'medium');
  const [assigneeId, setAssigneeId] = useState<number | null>(initial?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      status: status as Task['status'],
      priority: priority as Task['priority'],
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    });
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
          {initial ? 'Edit Task' : 'New Task'}
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.85rem', color: '#475569' }}>Title *</label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Task title"
          />

          <label style={{ fontSize: '0.85rem', color: '#475569' }}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Status</label>
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Priority</label>
              <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: '0.85rem', color: '#475569' }}>Assignee</label>
          <select
            style={inputStyle}
            value={assigneeId ?? ''}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <label style={{ fontSize: '0.85rem', color: '#475569' }}>Due Date</label>
          <input
            style={inputStyle}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              {initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

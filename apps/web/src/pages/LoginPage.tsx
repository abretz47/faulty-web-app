import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f5f9',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '2.5rem',
    width: '360px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  heading: { marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' },
  label: { display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#475569' },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    marginBottom: '1rem',
  },
  btn: {
    width: '100%',
    padding: '0.6rem',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  hint: { marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/projects');
    } catch {
      // Silently ignore login errors – the user can try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>🗂 Team Task Tracker</h1>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={styles.hint}>
          Demo accounts: alice@example.com / carol@example.com (password: password123)
        </p>
      </div>
    </div>
  );
}

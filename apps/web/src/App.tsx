import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import TasksPage from './pages/TasksPage.tsx';
import AuditPage from './pages/AuditPage.tsx';

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.75rem 1.5rem',
    background: '#1e293b',
    color: '#f8fafc',
  },
  brand: { fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc', textDecoration: 'none' },
  link: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' },
  activeLink: { color: '#e2e8f0', fontWeight: 600 },
  spacer: { flex: 1 },
  userInfo: { fontSize: '0.85rem', color: '#94a3b8' },
  logoutBtn: {
    background: 'none',
    border: '1px solid #475569',
    color: '#94a3b8',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  main: { padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' },
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <NavLink to="/projects" style={styles.brand}>
        🗂 Team Tracker
      </NavLink>
      <NavLink
        to="/projects"
        style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
      >
        Projects
      </NavLink>
      {user?.role === 'admin' && (
        <NavLink
          to="/audit"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          Audit Log
        </NavLink>
      )}
      <div style={styles.spacer} />
      <span style={styles.userInfo}>
        {user?.name} · {user?.teamName}
      </span>
      <button style={styles.logoutBtn} onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <Routes>
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId/tasks" element={<TasksPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="projects" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

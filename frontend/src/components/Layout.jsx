import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">TaskFlow</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FolderKanban size={16} />
            Projects
          </NavLink>
          <NavLink to="/my-tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <CheckSquare size={16} />
            My Tasks
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar" style={{ background: user?.avatar_color }}>{initials}</div>
            <div className="user-info">
              <div className="user-name truncate">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: 4 }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

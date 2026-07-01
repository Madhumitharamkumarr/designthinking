import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, FolderKanban, FileText,
  LogOut, Settings, Users, Upload, ClipboardList
} from 'lucide-react';

const navConfig = {
  admin: [
    { to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/events', icon: <CalendarDays />, label: 'Events' },
    { to: '/projects', icon: <FolderKanban />, label: 'Projects' },
    { to: '/submissions', icon: <FileText />, label: 'Submissions' },
    { to: '/assignments', icon: <ClipboardList />, label: 'Assignments' },
  ],
  coordinator: [
    { to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/events', icon: <CalendarDays />, label: 'My Events' },
    { to: '/projects', icon: <FolderKanban />, label: 'Projects' },
    { to: '/submissions', icon: <FileText />, label: 'Submissions' },
  ],
  mentor: [
    { to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/events', icon: <CalendarDays />, label: 'Events' },
    { to: '/projects', icon: <FolderKanban />, label: 'Assigned Projects' },
    { to: '/submissions', icon: <FileText />, label: 'Submissions' },
  ],
  student: [
    { to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/events', icon: <CalendarDays />, label: 'Events' },
    { to: '/projects', icon: <FolderKanban />, label: 'My Projects' },
    { to: '/submissions', icon: <FileText />, label: 'My Submissions' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || navConfig.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">P</div>
          <div>
            <div className="sidebar-logo-text">ProjectFlow</div>
            <div className="sidebar-logo-sub">Academic PM System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user" onClick={handleLogout} title="Logout">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
          <LogOut size={15} style={{ color: '#64748B', marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  );
}

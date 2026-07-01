import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/events': 'Events',
  '/projects': 'Projects',
  '/submissions': 'Submissions',
  '/events/create': 'Create Event',
};

export default function TopNavbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'ProjectFlow';

  return (
    <header className="topnav">
      <span className="topnav-title">{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ padding: '8px' }}>
          <Bell size={18} />
        </button>
        <span className={`topnav-badge`}>{user?.role}</span>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2160C4,#6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'default',
        }}>
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { projectService } from '../services/projectService';
import { submissionService } from '../services/submissionService';
import { authService } from '../services/authService';
import { mentorRequestService } from '../services/mentorRequestService';
import {
  CalendarDays, FolderKanban, FileText, Users,
  Plus, ArrowRight, TrendingUp, CheckCircle, Clock
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, projects: 0, submissions: 0, users: 0, approved: 0, pending: 0, pendingRequests: 0, unassigned: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, projRes, subRes] = await Promise.all([
          eventService.getAll(),
          projectService.getAll(),
          submissionService.getAll(),
        ]);
        const events = evRes.data;
        const projects = projRes.data;
        const submissions = subRes.data;

        let userCount = 0;
        let pendingRequests = 0;
        let unassigned = 0;
        if (user.role === 'admin') {
          try {
            const usersRes = await authService.getAllUsers();
            userCount = usersRes.data.length;
            const reqRes = await mentorRequestService.getAll({ status: 'pending' });
            pendingRequests = reqRes.data.length;
            unassigned = projects.filter(p => !p.assignedMentor || !p.assignedCoordinator).length;
          } catch (_) {}
        }

        setStats({
          events: events.length,
          projects: projects.length,
          submissions: submissions.length,
          users: userCount,
          approved: submissions.filter((s) => s.status === 'approved').length,
          pending: submissions.filter((s) => s.status === 'pending').length,
          pendingRequests,
          unassigned,
        });
        setRecentEvents(events.slice(0, 3));
        setRecentProjects(projects.slice(0, 3));
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const roleGreeting = {
    admin: 'Manage events, users, and the full platform.',
    coordinator: 'Manage your assigned events and review submissions.',
    mentor: 'View assigned projects and guide your students.',
    student: 'Submit your projects and track your progress.',
  };

  const statCards = [
    { label: 'Total Events', value: stats.events, icon: '📅', color: 'blue' },
    { label: 'Projects', value: stats.projects, icon: '📁', color: 'purple' },
    { label: 'Submissions', value: stats.submissions, icon: '📄', color: 'cyan' },
    { label: 'Approved', value: stats.approved, icon: '✅', color: 'green' },
    { label: 'Pending Review', value: stats.pending, icon: '⏳', color: 'amber' },
    ...(user.role === 'admin' ? [
      { label: 'Total Users', value: stats.users, icon: '👥', color: 'blue' },
      { label: 'Pending Requests', value: stats.pendingRequests, icon: '📩', color: 'amber' },
      { label: 'Unassigned Projects', value: stats.unassigned, icon: '⚠️', color: 'amber' },
    ] : []),
  ];

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>{roleGreeting[user?.role]}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/events/create')}>
              <Plus size={14} /> New Event
            </button>
          )}
          {user.role === 'student' && (
            <button className="btn btn-primary" onClick={() => navigate('/events')}>
              <CalendarDays size={14} /> Browse Events
            </button>
          )}
          {user.role === 'coordinator' && (
            <button className="btn btn-primary" onClick={() => navigate('/submissions')}>
              <FileText size={14} /> Review Submissions
            </button>
          )}
          {user.role === 'mentor' && (
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>
              <FolderKanban size={14} /> Review Assigned Projects
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.color}`} style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Events + Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flexWrap: 'wrap' }}>
        {/* Recent Events */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Recent Events</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📅</div>
              <p>No events yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentEvents.map((ev) => (
                <div key={ev._id}
                  onClick={() => navigate(`/events/${ev._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: 'var(--bg)', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: '1px solid var(--border)', transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: 'linear-gradient(135deg,#2160C4,#6366F1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>{ev.title[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ev.type}</div>
                  </div>
                  <span className={`type-badge ${ev.type}`}>{ev.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Recent Projects</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📁</div>
              <p>No projects yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentProjects.map((proj) => (
                <div key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: 'var(--bg)', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: '1px solid var(--border)', transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>{proj.projectTitle[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.projectTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{proj.studentId?.name || 'Student'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

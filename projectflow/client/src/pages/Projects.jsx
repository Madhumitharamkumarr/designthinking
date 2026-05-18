import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { eventService } from '../services/eventService';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ projectTitle: '', description: '', eventId: '', teamMembers: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([projectService.getAll(), eventService.getAll()])
      .then(([projRes, evRes]) => {
        setProjects(projRes.data);
        setEvents(evRes.data);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.projectTitle || !form.description || !form.eventId) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      const teamArr = form.teamMembers ? form.teamMembers.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const res = await projectService.create({ ...form, teamMembers: teamArr });
      setProjects([res.data, ...projects]);
      setShowModal(false);
      setForm({ projectTitle: '', description: '', eventId: '', teamMembers: '' });
      toast.success('Project created!');
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
    setSaving(false);
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user.role === 'student' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects found</h3>
          <p>{user.role === 'student' ? 'Click "New Project" to create your first project.' : 'No projects have been created yet.'}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((p) => <ProjectCard key={p._id} project={p} />)}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create New Project</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input className="form-input" placeholder="e.g. Smart Water Management System" value={form.projectTitle}
                  onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="Describe your project idea, goals, and approach…" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
              </div>
              <div className="form-group">
                <label className="form-label">Select Event *</label>
                <select className="form-select" value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })} required>
                  <option value="">— Choose an event —</option>
                  {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team Members (optional, comma-separated)</label>
                <input className="form-input" placeholder="Alice, Bob, Charlie" value={form.teamMembers}
                  onChange={(e) => setForm({ ...form, teamMembers: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

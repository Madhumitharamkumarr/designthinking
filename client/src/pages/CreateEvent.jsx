import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { authService } from '../services/authService';
import { eventService } from '../services/eventService';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', type: 'hackathon', description: '', coordinatorId: '', mentorIds: [],
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authService.getAllUsers()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'));
  }, []);

  const coordinators = users.filter((u) => u.role === 'coordinator');
  const mentors = users.filter((u) => u.role === 'mentor');

  const toggleMentor = (id) => {
    setForm((f) => ({
      ...f,
      mentorIds: f.mentorIds.includes(id) ? f.mentorIds.filter((m) => m !== id) : [...f.mentorIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.coordinatorId) {
      return toast.error('Title, description, and coordinator are required');
    }
    setSaving(true);
    try {
      await eventService.create(form);
      toast.success('Event created successfully!');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
    setSaving(false);
  };

  return (
    <Layout>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Events
      </button>

      <div className="page-header">
        <div>
          <h1>Create New Event</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Set up a new hackathon, ideathon, or project event
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input className="form-input" placeholder="e.g. Smart India Hackathon 2024"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Event Type *</label>
              <select className="form-select" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="hackathon">🏆 Hackathon</option>
                <option value="ideathon">💡 Ideathon</option>
                <option value="mini-project">📁 Mini Project</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" placeholder="Describe the event, its goals, theme, and eligibility…"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} required />
            </div>

            <div className="form-group">
              <label className="form-label">Assign Coordinator *</label>
              {coordinators.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No coordinators registered yet. Ask users to register with the "Coordinator" role.
                </p>
              ) : (
                <select className="form-select" value={form.coordinatorId}
                  onChange={(e) => setForm({ ...form, coordinatorId: e.target.value })} required>
                  <option value="">— Select a coordinator —</option>
                  {coordinators.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Assign Mentors (optional)</label>
              {mentors.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No mentors registered yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {mentors.map((u) => (
                    <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={form.mentorIds.includes(u._id)}
                        onChange={() => toggleMentor(u._id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                      />
                      <span>{u.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({u.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="divider" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Plus size={14} />
                {saving ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

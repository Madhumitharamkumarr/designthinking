import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StageProgressBar from '../components/StageProgressBar';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { stageService } from '../services/stageService';
import { projectService } from '../services/projectService';
import { submissionService } from '../services/submissionService';
import toast from 'react-hot-toast';
import { Plus, ArrowLeft, Clock, Users, Calendar, Trash2 } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stages, setStages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState({ stageName: 'Idea', deadline: '', instructions: '' });
  const [savingStage, setSavingStage] = useState(false);

  const isCoordinator = user.role === 'coordinator' || user.role === 'admin';
  const isStudent = user.role === 'student';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evRes, stRes, projRes] = await Promise.all([
          eventService.getById(id),
          stageService.getByEvent(id),
          projectService.getAll({ eventId: id }),
        ]);
        setEvent(evRes.data);
        setStages(stRes.data);
        setProjects(projRes.data);

        // fetch submissions for this event's projects
        if (projRes.data.length > 0) {
          const subRes = await submissionService.getAll();
          const eventProjectIds = projRes.data.map((p) => p._id);
          setSubmissions(subRes.data.filter((s) => eventProjectIds.includes(s.projectId?._id)));
        }
      } catch (err) {
        toast.error('Failed to load event');
      }
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const handleCreateStage = async (e) => {
    e.preventDefault();
    setSavingStage(true);
    try {
      const res = await stageService.create({ ...stageForm, eventId: id });
      setStages([...stages, res.data].sort((a, b) => a.order - b.order));
      setShowStageModal(false);
      setStageForm({ stageName: 'Idea', deadline: '', instructions: '' });
      toast.success('Stage created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create stage');
    }
    setSavingStage(false);
  };

  const handleDeleteStage = async (stageId) => {
    if (!confirm('Delete this stage?')) return;
    try {
      await stageService.delete(stageId);
      setStages(stages.filter((s) => s._id !== stageId));
      toast.success('Stage deleted');
    } catch {
      toast.error('Failed to delete stage');
    }
  };

  // Student's own project in this event
  const myProject = projects.find((p) => p.studentId?._id === user._id);
  const mySubmissions = submissions.filter((s) => s.projectId?._id === myProject?._id);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!event) return <Layout><div className="empty-state"><div className="empty-state-icon">❌</div><h3>Event not found</h3></div></Layout>;

  return (
    <Layout>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Events
      </button>

      {/* Event Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0F172A,#1E3A5F)',
        borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span className={`type-badge ${event.type}`}>{event.type}</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{event.title}</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, maxWidth: 500 }}>{event.description}</p>
          <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
              <Users size={14} /> Coordinator: <strong style={{ color: '#fff' }}>{event.coordinatorId?.name}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
              <Users size={14} /> Mentors: <strong style={{ color: '#fff' }}>{event.mentorIds?.length || 0}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
              <Calendar size={14} /> Created: <strong style={{ color: '#fff' }}>{new Date(event.createdAt).toLocaleDateString('en-IN')}</strong>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isCoordinator && (
            <button className="btn btn-primary" onClick={() => setShowStageModal(true)}>
              <Plus size={14} /> Add Stage
            </button>
          )}
          {isStudent && !myProject && (
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>
              <Plus size={14} /> Create Project
            </button>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">📊 Stage Progress</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {stages.length} stage{stages.length !== 1 ? 's' : ''} defined
          </span>
        </div>
        <StageProgressBar stages={stages} submissions={mySubmissions} />
      </div>

      {/* Stages List */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">🗂 Stages</span>
        </div>
        {stages.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-icon">🗂</div>
            <p>No stages created yet{isCoordinator ? '. Click "Add Stage" to get started.' : '.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stages.map((stage) => (
              <div key={stage._id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: stage.stageName === 'Idea' ? 'var(--primary-bg)' : stage.stageName === 'Prototype' ? '#EDE9FE' : '#D1FAE5',
                  color: stage.stageName === 'Idea' ? 'var(--primary)' : stage.stageName === 'Prototype' ? '#6D28D9' : '#065F46',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{stage.order}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{stage.stageName}</div>
                  {stage.instructions && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{stage.instructions}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    <Clock size={12} /> Deadline: {new Date(stage.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {isCoordinator && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStage(stage._id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects in this event */}
      {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'mentor') && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">📁 Projects ({projects.length})</span>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon">📁</div>
              <p>No projects submitted for this event yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Project</th><th>Student</th><th>Team</th><th>Actions</th></tr></thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj._id}>
                      <td style={{ fontWeight: 600 }}>{proj.projectTitle}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{proj.studentId?.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{proj.teamMembers?.join(', ') || '—'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${proj._id}`)}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Stage Modal */}
      {showStageModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowStageModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Stage</span>
              <button className="modal-close" onClick={() => setShowStageModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateStage}>
              <div className="form-group">
                <label className="form-label">Stage Name</label>
                <select className="form-select" value={stageForm.stageName}
                  onChange={(e) => setStageForm({ ...stageForm, stageName: e.target.value })}>
                  {['Idea', 'Prototype', 'Final'].map((s) => (
                    <option key={s} value={s}
                      disabled={stages.some((st) => st.stageName === s)}>{s}{stages.some((st) => st.stageName === s) ? ' (added)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={stageForm.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStageForm({ ...stageForm, deadline: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Instructions (optional)</label>
                <textarea className="form-textarea" placeholder="Guidelines for this stage…" value={stageForm.instructions}
                  onChange={(e) => setStageForm({ ...stageForm, instructions: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStageModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingStage}>
                  {savingStage ? 'Saving…' : 'Create Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

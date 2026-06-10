import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { eventService } from '../services/eventService';
import { authService } from '../services/authService';
import { mentorRequestService } from '../services/mentorRequestService';
import toast from 'react-hot-toast';
import { Users, CheckCircle, XCircle, UserPlus, Filter, ArrowRight } from 'lucide-react';

export default function Assignments() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [overrideMentorId, setOverrideMentorId] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assignType, setAssignType] = useState('mentor');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [filterEvent, setFilterEvent] = useState('');

  const mentors = allUsers.filter((u) => u.role === 'mentor');
  const coordinators = allUsers.filter((u) => u.role === 'coordinator');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, evRes, usersRes, reqRes] = await Promise.all([
          projectService.getAll(),
          eventService.getAll(),
          authService.getAllUsers(),
          mentorRequestService.getAll(),
        ]);
        setProjects(projRes.data);
        setEvents(evRes.data);
        setAllUsers(usersRes.data);
        setMentorRequests(reqRes.data);
      } catch {
        toast.error('Failed to load data');
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const pendingRequests = mentorRequests.filter((r) => r.status === 'pending');

  const handleReviewRequest = async (status) => {
    setReviewing(true);
    try {
      const res = await mentorRequestService.review(reviewModal._id, {
        status,
        adminNote,
        overrideMentorId: overrideMentorId || undefined,
      });
      setMentorRequests((prev) =>
        prev.map((r) => (r._id === reviewModal._id ? res.data : r))
      );
      if (status === 'approved') {
        const mentorId = overrideMentorId || reviewModal.requestedMentorId?._id;
        setProjects((prev) =>
          prev.map((p) =>
            p._id === reviewModal.projectId?._id
              ? { ...p, assignedMentor: allUsers.find((u) => u._id === mentorId) }
              : p
          )
        );
      }
      setReviewModal(null);
      setAdminNote('');
      setOverrideMentorId('');
      toast.success(`Request ${status}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    }
    setReviewing(false);
  };

  const handleAssign = async () => {
    if (!selectedUserId) return toast.error('Select a user');
    setAssigning(true);
    try {
      const fn = assignType === 'mentor'
        ? projectService.assignMentor(assignModal._id, { mentorId: selectedUserId })
        : projectService.assignCoordinator(assignModal._id, { coordinatorId: selectedUserId });
      const res = await fn;
      setProjects((prev) => prev.map((p) => (p._id === assignModal._id ? res.data : p)));
      setAssignModal(null);
      setSelectedUserId('');
      toast.success(`${assignType === 'mentor' ? 'Mentor' : 'Coordinator'} assigned!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
    setAssigning(false);
  };

  const handleUnassign = async (projectId, type) => {
    if (!confirm(`Remove ${type} assignment?`)) return;
    try {
      const fn = type === 'mentor'
        ? projectService.unassignMentor(projectId)
        : projectService.unassignCoordinator(projectId);
      const res = await fn;
      setProjects((prev) => prev.map((p) => (p._id === projectId ? res.data : p)));
      toast.success(`${type === 'mentor' ? 'Mentor' : 'Coordinator'} removed`);
    } catch {
      toast.error('Failed to unassign');
    }
  };

  const filteredProjects = filterEvent
    ? projects.filter((p) => (p.eventId?._id || p.eventId) === filterEvent)
    : projects;

  const stats = {
    total: projects.length,
    withMentor: projects.filter((p) => p.assignedMentor).length,
    withCoord: projects.filter((p) => p.assignedCoordinator).length,
    pendingReqs: pendingRequests.length,
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Project Assignments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Manage mentor requests and project assignments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Projects', value: stats.total, icon: '📁', color: '#EFF6FF', text: '#1D4ED8' },
          { label: 'Mentor Assigned', value: stats.withMentor, icon: '🎓', color: '#D1FAE5', text: '#065F46' },
          { label: 'Coordinator Assigned', value: stats.withCoord, icon: '👨‍🏫', color: '#EDE9FE', text: '#6D28D9' },
          { label: 'Pending Requests', value: stats.pendingReqs, icon: '⏳', color: '#FEF3C7', text: '#92400E' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.text }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('requests')}>
          Mentor Requests ({mentorRequests.length})
        </button>
        <button className={`btn btn-sm ${tab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('assignments')}>
          All Assignments ({projects.length})
        </button>
      </div>

      {/* ─── MENTOR REQUESTS TAB ─── */}
      {tab === 'requests' && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">📩 Student Mentor Requests</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <button key={f} className="btn btn-ghost btn-sm"
                  style={{ textTransform: 'capitalize', fontSize: 12 }}
                  onClick={() => {/* filter state if needed */}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {mentorRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📩</div>
              <p>No mentor requests yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Student</th>
                    <th>Requested Mentor</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorRequests.map((req) => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 600 }}>{req.projectId?.projectTitle || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{req.studentId?.name || '—'}</td>
                      <td>{req.requestedMentorId?.name || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.reason || '—'}
                      </td>
                      <td>
                        <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}
                          style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                            background: req.status === 'approved' ? '#D1FAE5' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                            color: req.status === 'approved' ? '#065F46' : req.status === 'rejected' ? '#991B1B' : '#92400E',
                          }}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => { setReviewModal(req); setAdminNote(''); setOverrideMentorId(''); }}>
                            Review
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {req.adminNote ? `"${req.adminNote.slice(0, 30)}…"` : 'Reviewed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ASSIGNMENTS TAB ─── */}
      {tab === 'assignments' && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">📋 Project Assignments</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-select" style={{ width: 200, fontSize: 13 }}
                value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
                <option value="">All Events</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📁</div>
              <p>No projects found</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Event</th>
                    <th>Student</th>
                    <th>Assigned Mentor</th>
                    <th>Assigned Coordinator</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => (
                    <tr key={proj._id}>
                      <td style={{ fontWeight: 600 }}>{proj.projectTitle}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        <span className={`type-badge ${proj.eventId?.type || ''}`}>{proj.eventId?.title || '—'}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{proj.studentId?.name || '—'}</td>
                      <td>
                        {proj.assignedMentor ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{proj.assignedMentor.name}</span>
                            {user.role === 'admin' && (
                              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11, color: '#EF4444' }}
                                onClick={() => handleUnassign(proj._id, 'mentor')}>✕</button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#EF4444', fontSize: 13, fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {proj.assignedCoordinator ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{proj.assignedCoordinator.name}</span>
                            {user.role === 'admin' && (
                              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11, color: '#EF4444' }}
                                onClick={() => handleUnassign(proj._id, 'coordinator')}>✕</button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#EF4444', fontSize: 13, fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                            onClick={() => { setAssignModal(proj); setAssignType('mentor'); setSelectedUserId(''); }}>
                            <UserPlus size={12} /> Mentor
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                            onClick={() => { setAssignModal(proj); setAssignType('coordinator'); setSelectedUserId(''); }}>
                            <UserPlus size={12} /> Coord
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── REVIEW MENTOR REQUEST MODAL ─── */}
      {reviewModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Review Mentor Request</span>
              <button className="modal-close" onClick={() => setReviewModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>PROJECT</div>
                  <div style={{ fontWeight: 700 }}>{reviewModal.projectId?.projectTitle}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>STUDENT</div>
                  <div style={{ fontWeight: 700 }}>{reviewModal.studentId?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>REQUESTED MENTOR</div>
                  <div style={{ fontWeight: 700 }}>{reviewModal.requestedMentorId?.name}</div>
                </div>
              </div>
              {reviewModal.reason && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                  <strong>Student's Reason:</strong> {reviewModal.reason}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Override Mentor (optional)</label>
              <select className="form-select" value={overrideMentorId}
                onChange={(e) => setOverrideMentorId(e.target.value)}>
                <option value="">— Use requested mentor ({reviewModal.requestedMentorId?.name}) —</option>
                {mentors.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Note (optional)</label>
              <textarea className="form-textarea" placeholder="Your note about this decision…"
                value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={reviewing} onClick={() => handleReviewRequest('rejected')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={14} /> {reviewing ? '…' : 'Reject'}
              </button>
              <button className="btn btn-primary" disabled={reviewing} onClick={() => handleReviewRequest('approved')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> {reviewing ? '…' : 'Approve & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ASSIGN MODAL ─── */}
      {assignModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Assign {assignType === 'mentor' ? 'Mentor' : 'Coordinator'}</span>
              <button className="modal-close" onClick={() => setAssignModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>PROJECT</div>
              <div style={{ fontWeight: 700 }}>{assignModal.projectTitle}</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Select {assignType === 'mentor' ? 'Mentor' : 'Coordinator'} *
              </label>
              <select className="form-select" value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)} required>
                <option value="">— Choose —</option>
                {(assignType === 'mentor' ? mentors : coordinators).map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={assigning || !selectedUserId} onClick={handleAssign}>
                <UserPlus size={14} /> {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

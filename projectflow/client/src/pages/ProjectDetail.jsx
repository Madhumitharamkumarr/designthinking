import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StageProgressBar from '../components/StageProgressBar';
import FileUpload from '../components/FileUpload';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { stageService } from '../services/stageService';
import { submissionService } from '../services/submissionService';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, Send, MessageSquare } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user.role === 'student' && project?.studentId?._id === user._id;
  const canSubmit = isOwner;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const projRes = await projectService.getById(id);
        setProject(projRes.data);
        const [stRes, subRes] = await Promise.all([
          stageService.getByEvent(projRes.data.eventId._id),
          submissionService.getAll({ projectId: id }),
        ]);
        setStages(stRes.data);
        setSubmissions(subRes.data);
      } catch {
        toast.error('Failed to load project');
      }
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const getSubmissionForStage = (stageId) => submissions.find((s) => s.stageId?._id === stageId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile) return toast.error('Please upload a file first');
    setSubmitting(true);
    try {
      const res = await submissionService.create({
        projectId: id,
        stageId: selectedStage._id,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        notes,
      });
      setSubmissions((prev) => {
        const exists = prev.find((s) => s.stageId?._id === selectedStage._id);
        if (exists) return prev.map((s) => s._id === exists._id ? res.data : s);
        return [...prev, res.data];
      });
      setShowSubmitModal(false);
      setUploadedFile(null);
      setNotes('');
      toast.success('Submission submitted for review!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!project) return <Layout><div className="empty-state"><div className="empty-state-icon">❌</div><h3>Project not found</h3></div></Layout>;

  return (
    <Layout>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Projects
      </button>

      {/* Project Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0F172A,#1E3A5F)',
        borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 24,
      }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {project.projectTitle}
        </h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, maxWidth: 600, marginBottom: 16 }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
            👤 Student: <strong style={{ color: '#fff' }}>{project.studentId?.name}</strong>
          </div>
          <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
            📅 Event: <strong style={{ color: '#fff' }}>{project.eventId?.title}</strong>
          </div>
          {project.teamMembers?.length > 0 && (
            <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
              👥 Team: <strong style={{ color: '#fff' }}>{project.teamMembers.join(', ')}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">📊 Submission Progress</span>
        </div>
        <StageProgressBar stages={stages} submissions={submissions} />
      </div>

      {/* Stages & Submissions */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">📄 Stage Submissions</span>
        </div>
        {stages.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-icon">🗂</div>
            <p>No stages defined for this event yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stages.map((stage) => {
              const sub = getSubmissionForStage(stage._id);
              return (
                <div key={stage._id} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  {/* Stage header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13,
                      }}>{stage.order}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{stage.stageName} Stage</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Deadline: {new Date(stage.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {sub ? <StatusBadge status={sub.status} /> : (
                        <span className="badge" style={{ background: '#F1F5F9', color: '#64748B' }}>Not Submitted</span>
                      )}
                      {canSubmit && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedStage(stage); setShowSubmitModal(true); }}>
                          <Send size={12} /> {sub ? 'Re-submit' : 'Submit'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submission details */}
                  <div style={{ padding: '14px 18px' }}>
                    {stage.instructions && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>
                        📋 {stage.instructions}
                      </p>
                    )}
                    {sub ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                              <ExternalLink size={13} /> View File
                            </a>
                          )}
                          {sub.notes && (
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                              Note: {sub.notes}
                            </span>
                          )}
                        </div>
                        {sub.feedback && (
                          <div className={`feedback-box ${sub.status === 'approved' ? 'success' : ''}`}>
                            <MessageSquare size={13} style={{ display: 'inline', marginRight: 6 }} />
                            <strong>Feedback:</strong> {sub.feedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        No submission yet for this stage.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && selectedStage && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSubmitModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Submit – {selectedStage.stageName} Stage</span>
              <button className="modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Upload File</label>
                <FileUpload onUpload={(f) => setUploadedFile(f)} disabled={submitting} />
                {uploadedFile && (
                  <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>
                    ✅ {uploadedFile.fileName} ready to submit
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any notes for the coordinator…" value={notes}
                  onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !uploadedFile}>
                  <Send size={14} />
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

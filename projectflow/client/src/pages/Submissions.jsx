import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SubmissionTable from '../components/SubmissionTable';
import { useAuth } from '../context/AuthContext';
import { submissionService } from '../services/submissionService';
import toast from 'react-hot-toast';
import { Filter, CheckCircle, XCircle } from 'lucide-react';

export default function Submissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const isCoordinator = user.role === 'coordinator' || user.role === 'admin';

  useEffect(() => {
    submissionService.getAll()
      .then((res) => setSubmissions(res.data))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const handleReview = (sub) => {
    setReviewModal(sub);
    setFeedback('');
  };

  const submitReview = async (status) => {
    setReviewing(true);
    try {
      const res = await submissionService.review(reviewModal._id, { status, feedback });
      setSubmissions((prev) => prev.map((s) => s._id === reviewModal._id ? { ...s, status: res.data.status, feedback: res.data.feedback } : s));
      setReviewModal(null);
      toast.success(`Submission ${status}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    }
    setReviewing(false);
  };

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Submissions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.all, color: '#EFF6FF', text: '#1D4ED8', icon: '📄' },
          { label: 'Pending', value: counts.pending, color: '#FEF3C7', text: '#92400E', icon: '⏳' },
          { label: 'Approved', value: counts.approved, color: '#D1FAE5', text: '#065F46', icon: '✅' },
          { label: 'Rejected', value: counts.rejected, color: '#FEE2E2', text: '#991B1B', icon: '❌' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(s.label.toLowerCase())}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.text }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <SubmissionTable
          submissions={filtered}
          onReview={handleReview}
          showReview={isCoordinator}
        />
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Review Submission</span>
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
                  <div style={{ fontWeight: 700 }}>{reviewModal.projectId?.studentId?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>STAGE</div>
                  <div style={{ fontWeight: 700 }}>{reviewModal.stageId?.stageName}</div>
                </div>
              </div>

              {reviewModal.fileUrl && (
                <a href={reviewModal.fileUrl} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  View Submitted File ↗
                </a>
              )}
              {reviewModal.notes && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                  <strong>Student Note:</strong> {reviewModal.notes}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Feedback (optional)</label>
              <textarea className="form-textarea" placeholder="Write your feedback for the student…"
                value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={reviewing} onClick={() => submitReview('rejected')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={14} /> {reviewing ? '…' : 'Reject'}
              </button>
              <button className="btn btn-success" disabled={reviewing} onClick={() => submitReview('approved')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D1FAE5', color: '#065F46' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#D1FAE5'; e.currentTarget.style.color = '#065F46'; }}>
                <CheckCircle size={14} /> {reviewing ? '…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

import StatusBadge from './StatusBadge';
import { ExternalLink, MessageSquare } from 'lucide-react';

export default function SubmissionTable({ submissions, onReview, showReview }) {
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (!submissions?.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <h3>No submissions yet</h3>
        <p>Submissions will appear here once students start submitting their work.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Student</th>
            <th>Stage</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>File</th>
            {showReview && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => (
            <tr key={sub._id}>
              <td style={{ fontWeight: 600 }}>
                {sub.projectId?.projectTitle || '—'}
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>
                {sub.projectId?.studentId?.name || '—'}
              </td>
              <td>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--primary-bg)', color: 'var(--primary)',
                  padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                }}>
                  {sub.stageId?.stageName || '—'}
                </span>
              </td>
              <td><StatusBadge status={sub.status} /></td>
              <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(sub.createdAt)}</td>
              <td>
                {sub.fileUrl ? (
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
                    <ExternalLink size={13} /> View
                  </a>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No file</span>}
              </td>
              {showReview && (
                <td>
                  {sub.status === 'pending' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onReview(sub)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <MessageSquare size={13} /> Review
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {sub.feedback ? `"${sub.feedback.slice(0, 30)}…"` : 'Reviewed'}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

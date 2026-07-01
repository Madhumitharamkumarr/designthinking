import { useNavigate } from 'react-router-dom';
import { User, CalendarDays } from 'lucide-react';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="event-card" onClick={() => navigate(`/projects/${project._id}`)}>
      <div className="event-card-header">
        <div style={{ flex: 1 }}>
          <div className="event-card-title">{project.projectTitle}</div>
          <p className="event-card-meta" style={{ marginTop: 4 }}>
            {project.description?.slice(0, 70)}{project.description?.length > 70 ? '…' : ''}
          </p>
        </div>
        <span className={`type-badge ${project.eventId?.type || 'other'}`}>
          {project.eventId?.type || 'Project'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <User size={13} />
          <span>By: <strong>{project.studentId?.name || 'N/A'}</strong></span>
        </div>
        {project.eventId?.title && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            📅 {project.eventId.title}
          </div>
        )}
      </div>

      <div className="event-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <CalendarDays size={13} />
          {formatDate(project.createdAt)}
        </div>
        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View →</span>
      </div>
    </div>
  );
}

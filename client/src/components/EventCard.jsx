import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users } from 'lucide-react';

export default function EventCard({ event }) {
  const navigate = useNavigate();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="event-card-header">
        <div style={{ flex: 1 }}>
          <div className="event-card-title">{event.title}</div>
          <p className="event-card-meta" style={{ marginTop: 4 }}>
            {event.description?.slice(0, 80)}{event.description?.length > 80 ? '…' : ''}
          </p>
        </div>
        <span className={`type-badge ${event.type}`}>{event.type}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <Users size={13} />
          <span>Coordinator: <strong>{event.coordinatorId?.name || 'N/A'}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <Users size={13} />
          <span>Mentors: <strong>{event.mentorIds?.length || 0}</strong></span>
        </div>
      </div>

      <div className="event-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <CalendarDays size={13} />
          {formatDate(event.createdAt)}
        </div>
        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View Details →</span>
      </div>
    </div>
  );
}

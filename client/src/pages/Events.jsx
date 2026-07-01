import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    eventService.getAll()
      .then((res) => setEvents(res.data))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((ev) => {
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || ev.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Events</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {events.length} event{events.length !== 1 ? 's' : ''} available
          </p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => navigate('/events/create')}>
            <Plus size={14} /> Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {['all', 'hackathon', 'ideathon', 'mini-project', 'other'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'all' ? 'All Types' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>No events found</h3>
          <p>{search ? 'Try a different search term.' : 'No events have been created yet.'}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((ev) => <EventCard key={ev._id} event={ev} />)}
        </div>
      )}
    </Layout>
  );
}

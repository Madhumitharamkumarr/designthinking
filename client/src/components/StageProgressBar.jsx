import { CheckCircle } from 'lucide-react';

const STAGES = [
  { name: 'Idea', order: 1 },
  { name: 'Prototype', order: 2 },
  { name: 'Final', order: 3 },
];

export default function StageProgressBar({ stages = [], submissions = [] }) {
  // Find highest approved stage order
  const approvedOrders = submissions
    .filter((s) => s.status === 'approved' && s.stageId?.order)
    .map((s) => s.stageId.order);
  const maxApproved = approvedOrders.length ? Math.max(...approvedOrders) : 0;

  // Find current pending stage
  const pendingOrders = submissions
    .filter((s) => s.status === 'pending' && s.stageId?.order)
    .map((s) => s.stageId.order);
  const currentPending = pendingOrders.length ? Math.min(...pendingOrders) : null;

  const getStatus = (order) => {
    if (order <= maxApproved) return 'done';
    if (order === currentPending) return 'active';
    return 'upcoming';
  };

  return (
    <div className="stage-progress-bar">
      {STAGES.map((stage, idx) => {
        const status = getStatus(stage.order);
        return (
          <div key={stage.name} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className={`stage-step ${status === 'done' ? 'done' : status === 'active' ? 'active' : ''}`}
              style={{ flex: 'none' }}>
              <div className="stage-step-circle">
                {status === 'done' ? <CheckCircle size={18} /> : stage.order}
              </div>
              <div className="stage-step-label">{stage.name}</div>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`stage-connector ${stage.order <= maxApproved ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

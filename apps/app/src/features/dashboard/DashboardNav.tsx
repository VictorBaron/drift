import { useNavigate } from 'react-router-dom';

export function DashboardNav() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: '#1A1A1A',
        padding: '11px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#FFF', letterSpacing: '-0.03em' }}>
          pulse<span style={{ color: '#FF6B35' }}>.</span>
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#666',
            background: '#2A2A2A',
            padding: '2px 7px',
            borderRadius: 4,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          BETA
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#666' }}>Last sync: just now</span>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #333',
            background: 'transparent',
            color: '#FFF',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + New project
        </button>
      </div>
    </div>
  );
}

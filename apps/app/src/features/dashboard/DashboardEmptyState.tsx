import { useNavigate } from 'react-router-dom';

export function DashboardEmptyState() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 24px' }}>
      <div
        style={{
          textAlign: 'center',
          padding: '64px 48px',
          background: '#FFF',
          borderRadius: 16,
          border: '1px solid #E8E6E1',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 26,
            fontWeight: 400,
            color: '#1A1A1A',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          No projects yet
        </h2>
        <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 28px', lineHeight: 1.6 }}>
          Set up your first project to start tracking delivery, decisions, and drift.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            padding: '11px 28px',
            borderRadius: 8,
            border: 'none',
            background: '#1A1A1A',
            color: '#FFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Set up a project →
        </button>
      </div>
    </div>
  );
}

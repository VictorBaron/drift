interface DashboardFooterProps {
  projectCount: number;
}

export function DashboardFooter({ projectCount }: DashboardFooterProps) {
  return (
    <div
      style={{
        marginTop: 28,
        padding: '14px 20px',
        background: '#FFF',
        borderRadius: 10,
        border: '1px solid #E8E6E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 12, color: '#A09B94' }}>
        ⚡ {projectCount} projects loaded · Next auto-update: Monday at 7:00 AM
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #E8E6E1',
            background: '#FFF',
            color: '#6B6560',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Share to #leadership
        </button>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#1A1A1A',
            color: '#FFF',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

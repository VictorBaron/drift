import type { Project } from '@/types';

interface DriftAlertProps {
  project: Project;
}

export function DriftAlert({ project }: DriftAlertProps) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderRadius: 10,
        marginBottom: 20,
        background: 'linear-gradient(135deg, #FBE9E7 0%, #FFF3E0 100%)',
        border: '1px solid #FFAB91',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#BF360C', marginBottom: 4 }}>
          Needs attention this week
        </div>
        <div style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.6 }}>
          <strong>{project.name}</strong> has significant intent drift — {project.drift.details}
        </div>
      </div>
    </div>
  );
}

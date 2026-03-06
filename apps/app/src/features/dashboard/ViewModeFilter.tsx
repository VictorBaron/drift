type ViewMode = 'all' | 'drifting' | 'at-risk' | 'on-track';

interface ViewModeFilterProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const TABS: { key: ViewMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'drifting', label: '⚠ Drifting' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'on-track', label: 'On Track' },
];

export function ViewModeFilter({ value, onChange }: ViewModeFilterProps) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            border: '1px solid',
            transition: 'all 0.15s ease',
            borderColor: value === t.key ? '#1A1A1A' : '#E8E6E1',
            background: value === t.key ? '#1A1A1A' : '#FFF',
            color: value === t.key ? '#FFF' : '#6B6560',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

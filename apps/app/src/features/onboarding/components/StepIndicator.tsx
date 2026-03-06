export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < current ? '#1A1A1A' : '#E8E6E1',
            transition: 'background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

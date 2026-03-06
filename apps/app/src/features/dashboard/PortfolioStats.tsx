import type { Project } from '@/types';

interface PortfolioStatsProps {
  projects: Project[];
}

export function PortfolioStats({ projects }: PortfolioStatsProps) {
  const totalDecisions = projects.reduce((a, p) => a + p.decisions.length, 0);
  const totalBlockers = projects.reduce((a, p) => a + p.blockers.length, 0);
  const criticalBlockers = projects.reduce(
    (a, p) => a + p.blockers.filter((b) => b.severity === 'high').length,
    0,
  );
  const driftingCount = projects.filter((p) => p.drift.level !== 'none').length;
  const onTrackCount = projects.filter((p) => p.health === 'on-track').length;
  const atRiskCount = projects.filter((p) => p.health !== 'on-track').length;

  const stats = [
    {
      label: 'Active Projects',
      value: String(projects.length),
      sub: `${onTrackCount} on track, ${atRiskCount} at risk`,
      color: '#1A1A1A',
    },
    { label: 'Decisions', value: String(totalDecisions), sub: 'This week', color: '#1A1A1A' },
    {
      label: 'Blockers',
      value: String(totalBlockers),
      sub: `${criticalBlockers} critical`,
      color: totalBlockers > 0 ? '#E53935' : '#1A1A1A',
    },
    {
      label: 'Intent Drift',
      value: String(driftingCount),
      sub: 'projects drifting',
      color: driftingCount > 0 ? '#F57F17' : '#43A047',
    },
    { label: 'Avg Velocity', value: '—', sub: 'vs last week', color: '#A09B94' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
      {stats.map((s, i) => (
        <div
          key={i}
          style={{ background: '#FFF', borderRadius: 10, padding: '14px 16px', border: '1px solid #E8E6E1' }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#A09B94',
              marginBottom: 5,
            }}
          >
            {s.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: '#A09B94' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

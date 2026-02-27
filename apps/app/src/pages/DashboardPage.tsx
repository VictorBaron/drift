import { useState } from 'react';
import { ProjectCard } from '@/components/ProjectCard';
import { useLatestReports } from '@/features/reports/hooks/useLatestReports';
import type { Project } from '@/types';

type ViewMode = 'all' | 'drifting' | 'at-risk' | 'on-track';

function computeSubtitle(projects: Project[]): string {
  const slack = projects.reduce((a, p) => a + p.sources.slack, 0);
  const linear = projects.reduce((a, p) => a + p.sources.linear, 0);
  const notion = projects.reduce((a, p) => a + p.sources.notion, 0);
  return `Auto-generated from ${slack} Slack messages, ${linear} Linear tickets, and ${notion} Notion pages. Covering ${projects.length} active projects.`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function filterProjects(projects: Project[], viewMode: ViewMode): Project[] {
  if (viewMode === 'all') return projects;
  if (viewMode === 'drifting') return projects.filter((p) => p.drift.level !== 'none');
  return projects.filter((p) => p.health === viewMode);
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: '#FFF',
            borderRadius: 14,
            border: '1px solid #E8E6E1',
            height: 100,
            marginBottom: 12,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [expanded, setExpanded] = useState(new Set<string>());
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const { data: projects, isLoading, error } = useLatestReports();

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allProjects = projects ?? [];
  const filtered = filterProjects(allProjects, viewMode);

  const totalDecisions = allProjects.reduce((a, p) => a + p.decisions.length, 0);
  const totalBlockers = allProjects.reduce((a, p) => a + p.blockers.length, 0);
  const driftingCount = allProjects.filter((p) => p.drift.level !== 'none').length;
  const onTrackCount = allProjects.filter((p) => p.health === 'on-track').length;
  const atRiskCount = allProjects.filter((p) => p.health !== 'on-track').length;
  const highDriftProject = allProjects.find((p) => p.drift.level === 'high');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F3EF',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600&family=Source+Serif+4:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
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
        <span style={{ fontSize: 12, color: '#666' }}>Last sync: just now</span>
      </div>

      {isLoading && <DashboardSkeleton />}

      {error && (
        <div style={{ maxWidth: 920, margin: '32px auto', padding: '0 24px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: '#FFEBEE',
              border: '1px solid #FFCDD2',
              color: '#C62828',
              fontSize: 14,
            }}
          >
            Failed to load reports. Please refresh the page.
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#A09B94',
                marginBottom: 6,
              }}
            >
              {formatDate()}
            </div>
            <h1
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 34,
                fontWeight: 400,
                color: '#1A1A1A',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
              }}
            >
              Weekly pulse — Product × Engineering
            </h1>
            <p style={{ fontSize: 14, color: '#6B6560', margin: 0, lineHeight: 1.5 }}>{computeSubtitle(allProjects)}</p>
          </div>

          {/* Portfolio Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              {
                label: 'Active Projects',
                value: String(allProjects.length),
                sub: `${onTrackCount} on track, ${atRiskCount} at risk`,
                color: '#1A1A1A',
              },
              { label: 'Decisions', value: String(totalDecisions), sub: 'This week', color: '#1A1A1A' },
              {
                label: 'Blockers',
                value: String(totalBlockers),
                sub: `${allProjects.reduce((a, p) => a + p.blockers.filter((b) => b.severity === 'high').length, 0)} critical`,
                color: totalBlockers > 0 ? '#E53935' : '#1A1A1A',
              },
              {
                label: 'Intent Drift',
                value: String(driftingCount),
                sub: 'projects drifting',
                color: driftingCount > 0 ? '#F57F17' : '#43A047',
              },
              { label: 'Avg Velocity', value: '—', sub: 'vs last week', color: '#A09B94' },
            ].map((s, i) => (
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
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#A09B94' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Needs attention */}
          {highDriftProject && (
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
                  <strong>{highDriftProject.name}</strong> has significant intent drift —{' '}
                  {highDriftProject.drift.details}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'drifting', label: '⚠ Drifting' },
                { key: 'at-risk', label: 'At Risk' },
                { key: 'on-track', label: 'On Track' },
              ] as { key: ViewMode; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setViewMode(t.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  border: '1px solid',
                  transition: 'all 0.15s ease',
                  borderColor: viewMode === t.key ? '#1A1A1A' : '#E8E6E1',
                  background: viewMode === t.key ? '#1A1A1A' : '#FFF',
                  color: viewMode === t.key ? '#FFF' : '#6B6560',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Projects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  color: '#A09B94',
                  fontSize: 14,
                  background: '#FFF',
                  borderRadius: 14,
                  border: '1px solid #E8E6E1',
                }}
              >
                No projects match this filter
              </div>
            ) : (
              filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isExpanded={expanded.has(p.id)}
                  onToggle={() => toggleProject(p.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
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
              ⚡ {allProjects.length} projects loaded · Next auto-update: Monday at 7:00 AM
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
        </div>
      )}
    </div>
  );
}

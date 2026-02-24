import React, { useState } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { PROJECTS } from './fake/projects';

export default function PulseDashboard() {
  const [expanded, setExpanded] = useState(new Set([1]));
  const [viewMode, setViewMode] = useState('all');

  const toggleProject = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered =
    viewMode === 'all'
      ? PROJECTS
      : viewMode === 'drifting'
        ? PROJECTS.filter((p) => p.drift.level !== 'none')
        : PROJECTS.filter((p) => p.health === viewMode);

  const totalDecisions = PROJECTS.reduce((a, p) => a + p.decisions.length, 0);
  const totalBlockers = PROJECTS.reduce((a, p) => a + p.blockers.length, 0);
  const driftingCount = PROJECTS.filter((p) => p.drift.level !== 'none').length;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Last sync: 2 min ago</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#FF6B35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              VL
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#5E6AD2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: 11,
                fontWeight: 700,
                marginLeft: -8,
                border: '2px solid #1A1A1A',
              }}
            >
              JP
            </div>
          </div>
        </div>
      </div>

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
            Monday, February 23, 2026
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
          <p style={{ fontSize: 14, color: '#6B6560', margin: 0, lineHeight: 1.5 }}>
            Auto-generated from <strong>158 Slack messages</strong>, <strong>56 Linear tickets</strong>, and{' '}
            <strong>13 Notion pages</strong>. Covering 3 active projects for the duo <strong>Victor L.</strong> (CTO) &{' '}
            <strong>Julie P.</strong> (CPO).
          </p>
        </div>

        {/* Portfolio Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Active Projects', value: '3', sub: '2 on track, 1 at risk', color: '#1A1A1A' },
            { label: 'Decisions', value: String(totalDecisions), sub: 'This week', color: '#1A1A1A' },
            { label: 'Blockers', value: String(totalBlockers), sub: '2 critical', color: '#E53935' },
            {
              label: 'Intent Drift',
              value: String(driftingCount),
              sub: 'projects drifting',
              color: driftingCount > 0 ? '#F57F17' : '#43A047',
            },
            { label: 'Avg Velocity', value: '+12%', sub: 'vs last week', color: '#43A047' },
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

        {/* Attention needed */}
        {PROJECTS.some((p) => p.drift.level === 'high') && (
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
                <strong>Search Rewrite</strong> has significant intent drift — scope expanded ~40% into an
                infrastructure migration without Product review. The CTO needs to make the sharding decision (blocked 3
                days) and the CPO should validate whether the expanded scope still serves the original relevance KR.
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'drifting', label: '⚠ Drifting' },
            { key: 'at-risk', label: 'At Risk' },
            { key: 'on-track', label: 'On Track' },
          ].map((t) => (
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
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} isExpanded={expanded.has(p.id)} onToggle={() => toggleProject(p.id)} />
          ))}
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
            ⚡ Generated in <strong style={{ color: '#1A1A1A' }}>14 seconds</strong> · Next auto-update: Monday, Mar 2
            at 8:00 AM
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
    </div>
  );
}

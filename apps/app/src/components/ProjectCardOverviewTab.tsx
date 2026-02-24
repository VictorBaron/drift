import React from 'react';
import type { Blocker, DriftLevel, Project } from '../types';
import { driftConfig } from './config';
import { KRItem } from './KRItem';
import { SectionLabel } from './SectionLabel';

export function ProjectCardOverviewTab({ project }: { project: Project }) {
  const p = project;
  const driftLevel = p.drift.level as DriftLevel;
  return (
    <div>
      {/* Objective */}
      <div
        style={{
          padding: '16px 18px',
          background: '#F8F7F5',
          borderRadius: 10,
          marginBottom: 20,
          border: '1px solid #ECEAE6',
        }}
      >
        <SectionLabel color="#1A1A1A">
          <span style={{ fontSize: 13 }}>🎯</span> Product Objective
        </SectionLabel>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: '#1A1A1A',
            marginBottom: 6,
            fontFamily: "'Newsreader', Georgia, serif",
            lineHeight: 1.4,
          }}
        >
          {p.objective.goal}
        </div>
        <div style={{ fontSize: 11, color: '#A09B94', marginBottom: 14 }}>Source: {p.objective.origin}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {p.objective.keyResults.map((kr: { text: string; done: boolean }, i: number) => (
            <KRItem key={i} text={kr.text} done={kr.done} />
          ))}
        </div>
      </div>

      {/* Narrative */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>
          <span style={{ fontSize: 13 }}>📝</span> Weekly Narrative
        </SectionLabel>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: '#3A3530',
            margin: 0,
            fontFamily: "'Source Serif 4', Georgia, serif",
          }}
        >
          {p.narrative}
        </p>
      </div>

      {/* Drift Alert */}
      {driftLevel !== 'none' && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            marginBottom: 20,
            background: driftConfig[driftLevel].bg,
            border: `1px solid ${driftConfig[driftLevel].border}`,
          }}
        >
          <SectionLabel color={driftConfig[driftLevel].text}>
            <span style={{ fontSize: 13 }}>{driftConfig[driftLevel].icon}</span> Intent Drift Detected
          </SectionLabel>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: driftConfig[driftLevel].text }}>{p.drift.details}</div>
        </div>
      )}

      {/* Blockers */}
      {p.blockers.length > 0 && (
        <div>
          <SectionLabel>
            <span style={{ fontSize: 13 }}>🚧</span> Blockers
            <span style={{ color: '#E53935', fontSize: 10 }}>({p.blockers.length})</span>
          </SectionLabel>
          {p.blockers.map((b: Blocker, i: number) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                background: b.severity === 'high' ? '#FFF8F6' : '#FFFDF5',
                borderRadius: 10,
                marginBottom: 8,
                borderLeft: `3px solid ${b.severity === 'high' ? '#E53935' : '#FB8C00'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 4 }}>{b.text}</div>
              <div style={{ fontSize: 12, color: '#8A8580', marginBottom: 2 }}>
                Owner: {b.owner} · Since {b.since}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: b.severity === 'high' ? '#C62828' : '#E65100',
                  fontWeight: 500,
                }}
              >
                Impact: {b.impact}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

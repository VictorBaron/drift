import React from 'react';
import { Decision, DriftLevel, Project } from '../types';
import { driftConfig } from './config';
import { DecisionCard } from './DecisionCard';

export function ProjectCardDecisionsTab({ project }: { project: Project }) {
  const driftLevel = project.drift.level as DriftLevel;
  return (
    <div>
      <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 16, lineHeight: 1.5 }}>
        Decisions auto-detected from Slack conversations, Linear comments, and Notion changes. Each is evaluated for
        alignment with the original product intent.
      </div>
      {project.decisions.map((d: Decision, i: number) => (
        <DecisionCard key={i} decision={d} />
      ))}
      {driftLevel !== 'none' && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            marginTop: 16,
            background: driftConfig[driftLevel].bg,
            border: `1px solid ${driftConfig[driftLevel].border}`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: driftConfig[driftLevel].text, marginBottom: 6 }}>
            {driftConfig[driftLevel].icon} Cumulative Impact on Intent
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: driftConfig[driftLevel].text }}>
            {project.drift.details}
          </div>
        </div>
      )}
    </div>
  );
}

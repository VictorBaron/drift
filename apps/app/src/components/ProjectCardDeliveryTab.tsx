import React from 'react';
import { Project } from '../types';
import { SectionLabel } from './SectionLabel';

export function ProjectCardDeliveryTab({ project }: { project: Project }) {
  const p = project;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Merged', value: p.delivery.merged, color: '#43A047' },
          { label: 'In Review', value: p.delivery.inReview, color: '#FB8C00' },
          { label: 'Blocked', value: p.delivery.blocked, color: '#E53935' },
          { label: 'Created', value: p.delivery.created, color: '#78909C' },
          {
            label: 'Velocity',
            value: p.delivery.velocity,
            color: p.delivery.velocity.startsWith('+') ? '#43A047' : '#E53935',
          },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px', background: '#F8F7F5', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#A09B94', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <SectionLabel>
        <span style={{ fontSize: 13 }}>📅</span> Timeline Risk
      </SectionLabel>
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 10,
          background: '#F8F7F5',
          border: '1px solid #ECEAE6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>Target: {p.targetDate}</div>
          <div style={{ fontSize: 12, color: '#A09B94' }}>{p.daysToTarget} days remaining</div>
        </div>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: p.health === 'at-risk' ? '#FFF3E0' : '#E8F5E9',
            color: p.health === 'at-risk' ? '#E65100' : '#2E7D32',
          }}
        >
          {p.health === 'at-risk' ? '⚠ At risk of delay (est. 2-3 weeks)' : 'On track for target date'}
        </div>
      </div>
    </div>
  );
}

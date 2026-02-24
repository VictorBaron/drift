import React from 'react';
import { Project, Thread } from '../types';

export function ProjectCardThreadsTab({ project }: { project: Project }) {
  const p = project;
  return (
    <div>
      <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 16, lineHeight: 1.5 }}>
        Key Slack conversations with the most activity and decision-making signal this week.
      </div>
      {p.threads.map((t: Thread, i: number) => (
        <div
          key={i}
          style={{
            padding: '14px 18px',
            background: '#F8F7F5',
            borderRadius: 10,
            marginBottom: 10,
            border: '1px solid #ECEAE6',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.4 }}>{t.title}</span>
            <span style={{ fontSize: 11, color: '#A09B94', whiteSpace: 'nowrap', marginLeft: 12 }}>
              {t.messages} messages
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {t.participants.map((participant: string, j: number) => (
              <span
                key={j}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#ECEAE6',
                  color: '#6B6560',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {participant}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#A09B94' }}>{t.channel}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: t.outcome.includes('Decision')
                  ? '#E8F5E9'
                  : t.outcome.includes('Open')
                    ? '#FFF3E0'
                    : '#F0EEED',
                color: t.outcome.includes('Decision') ? '#2E7D32' : t.outcome.includes('Open') ? '#E65100' : '#6B6560',
              }}
            >
              {t.outcome}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

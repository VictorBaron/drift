import React from 'react';

const sourceLabels = { slack: 'Slack', linear: 'Linear', notion: 'Notion' } as const;
const sourceColors = { slack: '#4A154B', linear: '#5E6AD2', notion: '#000000' } as const;

export type SourceType = keyof typeof sourceColors;

export function SourceTag({ type, count }: { type: SourceType; count: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 4,
        background: `${sourceColors[type]}11`,
        color: sourceColors[type],
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {sourceLabels[type]} · {count}
    </span>
  );
}

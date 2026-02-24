import React from 'react';
import type { DriftLevel } from '../types';
import { driftConfig } from './config';

export function DriftBadge({ level, label }: { level: DriftLevel; label: string }) {
  const c = driftConfig[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 20,
        background: c.bg,
        color: c.text,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        border: `1px solid ${c.border}`,
      }}
    >
      <span style={{ fontSize: 10 }}>{c.icon}</span>
      {label}
    </span>
  );
}

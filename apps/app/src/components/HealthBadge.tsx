import React from 'react';
import type { Health } from '../types';
import { healthConfig } from './config';

export function HealthBadge({ health, label }: { health: Health; label: string }) {
  const c = healthConfig[health];
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
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {label}
    </span>
  );
}

import React from 'react';
import { Decision } from '../types';

const alignColors = {
  true: { bg: '#E8F5E9', label: 'Aligned', color: '#2E7D32' },
  partial: { bg: '#FFF8E1', label: 'Partial', color: '#F57F17' },
  false: { bg: '#FFEBEE', label: 'Misaligned', color: '#C62828' },
};

export function DecisionCard({ decision }: { decision: Decision }) {
  const align = alignColors[decision.alignedWithIntent as keyof typeof alignColors];
  return (
    <div
      style={{
        padding: '14px 16px',
        background: '#FAFAF8',
        borderRadius: 10,
        marginBottom: 10,
        borderLeft: '3px solid #1A1A1A',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.4, flex: 1 }}>
          {decision.text}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: align.bg,
            color: align.color,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {align.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#6B6560',
          lineHeight: 1.5,
          marginBottom: 8,
          fontStyle: 'italic',
          paddingLeft: 0,
        }}
      >
        ↳ Trade-off: {decision.tradeoff}
      </div>
      <div style={{ fontSize: 11, color: '#A09B94', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span>{decision.who}</span>
        <span style={{ color: '#D4D0C8' }}>·</span>
        <span>{decision.where}</span>
        <span style={{ color: '#D4D0C8' }}>·</span>
        <span>{decision.when}</span>
      </div>
    </div>
  );
}

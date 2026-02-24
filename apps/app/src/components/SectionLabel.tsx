import React from 'react';

export function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: color ?? '#A09B94',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
    </div>
  );
}

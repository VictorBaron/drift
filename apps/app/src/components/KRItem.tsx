import React from 'react';

export function KRItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0',
        fontSize: 13,
        color: done ? '#8A8580' : '#1A1A1A',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: done ? '#43A047' : 'transparent',
          border: done ? 'none' : '1.5px solid #D4D0C8',
          fontSize: 11,
          color: '#FFF',
          flexShrink: 0,
        }}
      >
        {done && '✓'}
      </span>
      <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{text}</span>
    </div>
  );
}

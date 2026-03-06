import type { Project } from '@/types';

interface DashboardHeaderProps {
  projects: Project[];
}

function computeSubtitle(projects: Project[]): string {
  const slack = projects.reduce((a, p) => a + p.sources.slack, 0);
  const linear = projects.reduce((a, p) => a + p.sources.linear, 0);
  const notion = projects.reduce((a, p) => a + p.sources.notion, 0);
  return `Auto-generated from ${slack} Slack messages, ${linear} Linear tickets, and ${notion} Notion pages. Covering ${projects.length} active projects.`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DashboardHeader({ projects }: DashboardHeaderProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#A09B94',
          marginBottom: 6,
        }}
      >
        {formatDate()}
      </div>
      <h1
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 34,
          fontWeight: 400,
          color: '#1A1A1A',
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
        }}
      >
        Weekly pulse — Product × Engineering
      </h1>
      <p style={{ fontSize: 14, color: '#6B6560', margin: 0, lineHeight: 1.5 }}>
        {computeSubtitle(projects)}
      </p>
    </div>
  );
}

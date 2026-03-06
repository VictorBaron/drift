import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/common/services/api';
import { ProjectCard } from '@/components/ProjectCard';
import { DashboardEmptyState } from '@/features/dashboard/DashboardEmptyState';
import { DashboardFooter } from '@/features/dashboard/DashboardFooter';
import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { DashboardNav } from '@/features/dashboard/DashboardNav';
import { DriftAlert } from '@/features/dashboard/DriftAlert';
import { PortfolioStats } from '@/features/dashboard/PortfolioStats';
import { ViewModeFilter } from '@/features/dashboard/ViewModeFilter';
import { useLatestReports } from '@/features/reports/hooks/useLatestReports';
import type { Project } from '@/types';

type ViewMode = 'all' | 'drifting' | 'at-risk' | 'on-track';

function filterProjects(projects: Project[], viewMode: ViewMode): Project[] {
  if (viewMode === 'all') return projects;
  if (viewMode === 'drifting') return projects.filter((p) => p.drift.level !== 'none');
  return projects.filter((p) => p.health === viewMode);
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: '#FFF',
            borderRadius: 14,
            border: '1px solid #E8E6E1',
            height: 100,
            marginBottom: 12,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [expanded, setExpanded] = useState(new Set<string>());
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const { data: projects, isLoading, error } = useLatestReports();
  const { data: rawProjects } = useQuery({ queryKey: ['projects'], queryFn: api.getProjects });

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allProjects = projects ?? [];
  const filtered = filterProjects(allProjects, viewMode);
  const highDriftProject = allProjects.find((p) => p.drift.level === 'high');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F3EF',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600&family=Source+Serif+4:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <DashboardNav />

      {isLoading && <DashboardSkeleton />}

      {error && (
        <div style={{ maxWidth: 920, margin: '32px auto', padding: '0 24px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: '#FFEBEE',
              border: '1px solid #FFCDD2',
              color: '#C62828',
              fontSize: 14,
            }}
          >
            Failed to load reports. Please refresh the page.
          </div>
        </div>
      )}

      {!isLoading && !error && rawProjects?.length === 0 && <DashboardEmptyState />}

      {!isLoading && !error && (rawProjects === undefined || rawProjects.length > 0) && (
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
          <DashboardHeader projects={allProjects} />
          <PortfolioStats projects={allProjects} />

          {highDriftProject && <DriftAlert project={highDriftProject} />}

          <ViewModeFilter value={viewMode} onChange={setViewMode} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  color: '#A09B94',
                  fontSize: 14,
                  background: '#FFF',
                  borderRadius: 14,
                  border: '1px solid #E8E6E1',
                }}
              >
                No projects match this filter
              </div>
            ) : (
              filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isExpanded={expanded.has(p.id)}
                  onToggle={() => toggleProject(p.id)}
                />
              ))
            )}
          </div>

          <DashboardFooter projectCount={allProjects.length} />
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/services/api';
import type { Project } from '@/types';
import type { ProjectJSON, ReportJSON } from '@/types/api';

function computeDaysToTarget(targetDate: string | null): number {
  if (!targetDate) return 0;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatTargetDate(targetDate: string | null): string {
  if (!targetDate) return '—';
  return new Date(targetDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mergeReportAndProject(report: ReportJSON, project: ProjectJSON): Project {
  return {
    id: project.id,
    name: project.name,
    emoji: project.emoji,
    health: report.content.health,
    healthLabel: report.content.healthLabel,
    pmLead: project.pmLeadName ?? '—',
    techLead: project.techLeadName ?? '—',
    team: project.teamName ?? '—',
    period: report.periodLabel,
    progress: report.progress,
    prevProgress: report.prevProgress,
    targetDate: formatTargetDate(project.targetDate),
    daysToTarget: computeDaysToTarget(project.targetDate),
    sources: report.content.sourceCounts,
    objective: {
      goal: project.productObjective ?? '',
      origin: project.objectiveOrigin ?? '',
      keyResults: report.content.keyResults,
    },
    narrative: report.content.narrative,
    decisions: report.content.decisions,
    drift: report.content.drift,
    blockers: report.content.blockers,
    delivery: report.content.delivery,
    threads: report.content.threads,
  };
}

export function useLatestReports() {
  const reports = useQuery({
    queryKey: ['reports', 'latest'],
    queryFn: api.getLatestReports,
  });

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const data = useMemo<Project[] | undefined>(() => {
    if (!reports.data || !projects.data) return undefined;

    const projectMap = new Map(projects.data.map((p) => [p.id, p]));

    return reports.data
      .map((report) => {
        const project = projectMap.get(report.projectId);
        if (!project) return null;
        return mergeReportAndProject(report, project);
      })
      .filter((p): p is Project => p !== null);
  }, [reports.data, projects.data]);

  return {
    data,
    isLoading: reports.isLoading || projects.isLoading,
    error: reports.error ?? projects.error,
  };
}

import React, { useState } from 'react';
import { Project } from '../types';
import { DriftBadge } from './DriftBadge';
import { HealthBadge } from './HealthBadge';
import { ProjectCardDecisionsTab } from './ProjectCardDecisionsTab';
import { ProjectCardDeliveryTab } from './ProjectCardDeliveryTab';
import { ProjectCardOverviewTab } from './ProjectCardOverviewTab';
import { ProjectCardThreadsTab } from './ProjectCardThreadsTab';
import { SourceTag } from './SourceTag';

export function ProjectCard({
  project,
  isExpanded,
  onToggle,
}: {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E8E6E1',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease',
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Card Header */}
      <div
        onClick={onToggle}
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}
      >
        <span style={{ fontSize: 26, lineHeight: 1, marginTop: 2 }}>{project.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span
              style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 19, fontWeight: 400, color: '#1A1A1A' }}
            >
              {project.name}
            </span>
            <HealthBadge health={project.health} label={project.healthLabel} />
            <DriftBadge level={project.drift.level} label={project.drift.label} />
          </div>
          <div style={{ fontSize: 12, color: '#A09B94', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <span>
              PM: <strong style={{ color: '#6B6560' }}>{project.pmLead}</strong>
            </span>
            <span style={{ color: '#D4D0C8' }}>·</span>
            <span>
              Tech: <strong style={{ color: '#6B6560' }}>{project.techLead}</strong>
            </span>
            <span style={{ color: '#D4D0C8' }}>·</span>
            <span>
              Target: <strong style={{ color: '#6B6560' }}>{project.targetDate}</strong> ({project.daysToTarget}d)
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                flex: 1,
                maxWidth: 220,
                height: 5,
                background: '#F0EEED',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${project.prevProgress}%`,
                  background: '#E0DDD8',
                  borderRadius: 3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${project.progress}%`,
                  background: '#1A1A1A',
                  borderRadius: 3,
                  transition: 'width 1s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{project.progress}%</span>
            <span
              style={{
                fontSize: 11,
                color: project.progress > project.prevProgress ? '#43A047' : '#E53935',
                fontWeight: 500,
              }}
            >
              {project.progress > project.prevProgress ? '+' : ''}
              {project.progress - project.prevProgress}%
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <SourceTag type="slack" count={project.sources.slack} />
            <SourceTag type="linear" count={project.sources.linear} />
            <SourceTag type="notion" count={project.sources.notion} />
          </div>
        </div>
        <span
          style={{
            fontSize: 16,
            color: '#C4C0BA',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            marginTop: 4,
          }}
        >
          ▾
        </span>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #E8E6E1' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E8E6E1', padding: '0 24px' }}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'decisions', label: `Decisions (${project.decisions.length})` },
              { key: 'delivery', label: 'Delivery' },
              { key: 'threads', label: `Key Threads (${project.threads.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: activeTab === t.key ? '#1A1A1A' : '#A09B94',
                  borderBottom: activeTab === t.key ? '2px solid #1A1A1A' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 24px' }}>
            {activeTab === 'overview' && <ProjectCardOverviewTab project={project} />}
            {activeTab === 'decisions' && <ProjectCardDecisionsTab project={project} />}
            {activeTab === 'delivery' && <ProjectCardDeliveryTab project={project} />}
            {activeTab === 'threads' && <ProjectCardThreadsTab project={project} />}
          </div>
        </div>
      )}
    </div>
  );
}

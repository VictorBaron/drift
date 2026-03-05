import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LinearTeam, SlackChannel } from '@/common/services/api';
import { api } from '@/common/services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const S = {
  page: {
    minHeight: '100vh',
    background: '#F5F3EF',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  nav: {
    background: '#1A1A1A',
    padding: '11px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  logo: { fontSize: 18, fontWeight: 700, color: '#FFF', letterSpacing: '-0.03em' } as React.CSSProperties,
  accent: { color: '#FF6B35' } as React.CSSProperties,
  container: { maxWidth: 680, margin: '0 auto', padding: '40px 24px' } as React.CSSProperties,
  card: {
    background: '#FFF',
    borderRadius: 16,
    border: '1px solid #E8E6E1',
    padding: '40px 48px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E8E6E1',
    fontSize: 14,
    color: '#1A1A1A',
    background: '#FAFAFA',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    outline: 'none',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    background: '#1A1A1A',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btnSecondary: {
    padding: '10px 24px',
    borderRadius: 8,
    border: '1px solid #E8E6E1',
    background: '#FFF',
    color: '#6B6560',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  field: { marginBottom: 24 } as React.CSSProperties,
};

function extractNotionPageId(input: string): string {
  const cleaned = input.trim();
  const uuidMatch = cleaned.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  const hexMatch = cleaned.match(/([0-9a-f]{32})/i);
  if (hexMatch) return hexMatch[1];
  return cleaned;
}

function ChannelPill({
  channel,
  selected,
  onClick,
}: {
  channel: SlackChannel;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: '1px solid',
        borderColor: selected ? '#1A1A1A' : '#E8E6E1',
        background: selected ? '#1A1A1A' : '#FFF',
        color: selected ? '#FFF' : '#6B6560',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      #{channel.name}
    </button>
  );
}

export function ProjectSetupPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const projects = await api.getProjects();
      return projects.find((p) => p.id === projectId) ?? null;
    },
    enabled: !!projectId,
  });

  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [linearTeams, setLinearTeams] = useState<LinearTeam[]>([]);
  const [linearConnected, setLinearConnected] = useState(false);

  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [linearTeamId, setLinearTeamId] = useState('');
  const [linearProjectId, setLinearProjectId] = useState('');
  const [notionInput, setNotionInput] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [notionTitle, setNotionTitle] = useState<string | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSlackChannels()
      .then(setChannels)
      .catch(() => {});
    api
      .getLinearTeams()
      .then((res) => {
        setLinearConnected(res.connected);
        setLinearTeams(res.teams);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!project) return;
    setSelectedChannelIds(project.slackChannelIds ?? []);
    setLinearTeamId(project.linearTeamId ?? '');
    setLinearProjectId(project.linearProjectId ?? '');
    setNotionPageId(project.notionPageId ?? '');
    setNotionInput(project.notionPageId ?? '');
  }, [project]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleNotionBlur = async () => {
    const raw = notionInput.trim();
    if (!raw) {
      setNotionPageId('');
      setNotionTitle(null);
      return;
    }
    const pageId = extractNotionPageId(raw);
    if (pageId === notionPageId) return;
    setNotionLoading(true);
    try {
      const preview = await api.getNotionPagePreview(pageId);
      setNotionPageId(pageId);
      setNotionTitle(preview.title);
    } catch {
      setNotionPageId(pageId);
      setNotionTitle(null);
    } finally {
      setNotionLoading(false);
    }
  };

  const selectedTeam = linearTeams.find((t) => t.id === linearTeamId);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateProjectSources(projectId, {
        slackChannelIds: selectedChannelIds,
        linearTeamId: linearTeamId || null,
        linearProjectId: linearProjectId || null,
        notionPageId: notionPageId || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (projectLoading) {
    return (
      <div
        style={{
          ...S.page,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A09B94',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6B6560', fontSize: 14 }}>Project not found.</p>
          <button style={{ ...S.btnSecondary, marginTop: 12 }} onClick={() => navigate('/dashboard')}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={S.nav}>
        <span style={S.logo}>
          pulse<span style={S.accent}>.</span>
        </span>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Back to dashboard
        </button>
      </div>

      <div style={S.container}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
            }}
          >
            {project.emoji} {project.name}
          </h1>
          <p style={{ fontSize: 14, color: '#6B6560', margin: 0 }}>Configure data sources for this project.</p>
        </div>

        <div style={S.card}>
          {/* Slack channels */}
          <div style={S.field}>
            <label style={S.label}>Slack channels</label>
            {channels.length === 0 ? (
              <div style={{ fontSize: 13, color: '#A09B94' }}>Loading channels…</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {channels.map((ch) => (
                  <ChannelPill
                    key={ch.id}
                    channel={ch}
                    selected={selectedChannelIds.includes(ch.id)}
                    onClick={() => toggleChannel(ch.id)}
                  />
                ))}
              </div>
            )}
            {selectedChannelIds.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#6B6560' }}>
                {selectedChannelIds.length} channel{selectedChannelIds.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Linear */}
          <div style={S.field}>
            <label style={S.label}>Linear project</label>
            {!linearConnected ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 8,
                  border: '1px dashed #E8E6E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 13, color: '#6B6560' }}>Connect Linear to link your tickets</span>
                <a
                  href={`${API_BASE}/integrations/linear/connect`}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    background: '#5E6AD2',
                    color: '#FFF',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Connect Linear
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  style={{ ...S.input, flex: 1 }}
                  value={linearTeamId}
                  onChange={(e) => {
                    setLinearTeamId(e.target.value);
                    setLinearProjectId('');
                  }}
                >
                  <option value="">Select team…</option>
                  {linearTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  style={{ ...S.input, flex: 1 }}
                  value={linearProjectId}
                  onChange={(e) => setLinearProjectId(e.target.value)}
                  disabled={!linearTeamId}
                >
                  <option value="">Select project…</option>
                  {selectedTeam?.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notion */}
          <div style={S.field}>
            <label style={S.label}>Notion page (optional)</label>
            <input
              style={S.input}
              value={notionInput}
              onChange={(e) => setNotionInput(e.target.value)}
              onBlur={handleNotionBlur}
              placeholder="Paste Notion page URL or ID"
            />
            {notionLoading && <div style={{ fontSize: 12, color: '#A09B94', marginTop: 4 }}>Fetching page…</div>}
            {notionTitle && !notionLoading && (
              <div
                style={{
                  marginTop: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  fontSize: 13,
                  color: '#166534',
                }}
              >
                ✓ {notionTitle}
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                color: '#C62828',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {saved && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#166534',
                fontSize: 13,
              }}
            >
              ✓ Sources saved successfully
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 24,
              borderTop: '1px solid #F0EEED',
            }}
          >
            <button style={S.btnSecondary} onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save sources'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

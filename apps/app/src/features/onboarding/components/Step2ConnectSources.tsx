import { useEffect, useState } from 'react';
import type { LinearTeam, SlackChannel } from '@/common/services/api';
import { api } from '@/common/services/api';
import { S } from '../styles';
import type { Step2Data } from '../types';
import { extractNotionPageId } from '../utils';
import { ChannelPill } from './ChannelPill';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

interface Step2ConnectSourcesProps {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
}

export function Step2ConnectSources({ data, onChange }: Step2ConnectSourcesProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [linearTeams, setLinearTeams] = useState<LinearTeam[]>([]);
  const [linearConnected, setLinearConnected] = useState(false);
  const [notionInput, setNotionInput] = useState(data.notionPageId);
  const [notionLoading, setNotionLoading] = useState(false);

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

  const toggleChannel = (id: string) => {
    const next = data.slackChannelIds.includes(id)
      ? data.slackChannelIds.filter((c) => c !== id)
      : [...data.slackChannelIds, id];
    onChange({ ...data, slackChannelIds: next });
  };

  const handleNotionBlur = async () => {
    const raw = notionInput.trim();
    if (!raw) return;

    const pageId = extractNotionPageId(raw);
    if (!pageId) return;

    setNotionLoading(true);
    try {
      const preview = await api.getNotionPagePreview(pageId);
      onChange({ ...data, notionPageId: pageId, notionTitle: preview.title });
    } catch {
      onChange({ ...data, notionPageId: pageId, notionTitle: null });
    } finally {
      setNotionLoading(false);
    }
  };

  const selectedTeam = linearTeams.find((t) => t.id === data.linearTeamId);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        Connect your sources
      </h2>
      <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 28px' }}>
        Select the Slack channels, Linear project and Notion spec for this project.
      </p>

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
                selected={data.slackChannelIds.includes(ch.id)}
                onClick={() => toggleChannel(ch.id)}
              />
            ))}
          </div>
        )}
      </div>

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
              value={data.linearTeamId}
              onChange={(e) => {
                const teamId = e.target.value;
                onChange({ ...data, linearTeamId: teamId, linearProjectId: '' });
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
              value={data.linearProjectId}
              onChange={(e) => onChange({ ...data, linearProjectId: e.target.value })}
              disabled={!data.linearTeamId}
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
        {data.notionTitle && !notionLoading && (
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
            ✓ {data.notionTitle}
          </div>
        )}
      </div>
    </div>
  );
}

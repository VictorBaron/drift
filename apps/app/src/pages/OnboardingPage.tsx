import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ExtractObjectiveResult, LinearTeam, SlackChannel } from '@/common/services/api';
import { api } from '@/common/services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

interface Step1Data {
  name: string;
  emoji: string;
  pmLeadName: string;
  techLeadName: string;
  teamName: string;
  targetDate: string;
}

interface Step2Data {
  slackChannelIds: string[];
  linearTeamId: string;
  linearProjectId: string;
  notionPageId: string;
  notionTitle: string | null;
}

interface Step3Data {
  productObjective: string;
  keyResults: { text: string; done: boolean }[];
  objectiveOrigin: 'notion' | 'manual';
}

const EMOJI_OPTIONS = ['🚀', '🎯', '⚡', '🔥', '💡', '🛠️', '📦', '🎨', '🌱', '🔮', '📊', '🏆'];

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
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E8E6E1',
    fontSize: 14,
    color: '#1A1A1A',
    background: '#FAFAFA',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    minHeight: 100,
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
  field: { marginBottom: 20 } as React.CSSProperties,
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < current ? '#1A1A1A' : '#E8E6E1',
            transition: 'background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function Step1({ data, onChange }: { data: Step1Data; onChange: (d: Step1Data) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        Create your first project
      </h2>
      <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 28px' }}>Tell us about the project you want to track.</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Project name *</label>
          <input
            style={S.input}
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="e.g. Mobile App Redesign"
          />
        </div>
        <div style={{ width: 80 }}>
          <label style={S.label}>Emoji</label>
          <select
            style={{ ...S.input, padding: '10px 8px', cursor: 'pointer' }}
            value={data.emoji}
            onChange={(e) => onChange({ ...data, emoji: e.target.value })}
          >
            {EMOJI_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={S.label}>PM Lead</label>
          <input
            style={S.input}
            value={data.pmLeadName}
            onChange={(e) => onChange({ ...data, pmLeadName: e.target.value })}
            placeholder="e.g. Alice Martin"
          />
        </div>
        <div>
          <label style={S.label}>Tech Lead</label>
          <input
            style={S.input}
            value={data.techLeadName}
            onChange={(e) => onChange({ ...data, techLeadName: e.target.value })}
            placeholder="e.g. Bob Chen"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={S.label}>Team name</label>
          <input
            style={S.input}
            value={data.teamName}
            onChange={(e) => onChange({ ...data, teamName: e.target.value })}
            placeholder="e.g. Growth Team"
          />
        </div>
        <div>
          <label style={S.label}>Target date</label>
          <input
            type="date"
            style={S.input}
            value={data.targetDate}
            onChange={(e) => onChange({ ...data, targetDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
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
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      #{channel.name}
    </button>
  );
}

function Step2({
  data,
  onChange,
  hasLinear,
}: {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
  hasLinear: boolean;
}) {
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

      {/* Slack */}
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

function Step3({
  data,
  onChange,
  hasNotion,
  notionPageId,
}: {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
  hasNotion: boolean;
  notionPageId: string;
}) {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);

  useEffect(() => {
    if (hasNotion && notionPageId && !extracted) {
      setExtracting(true);
      api
        .extractObjective(notionPageId)
        .then((result: ExtractObjectiveResult) => {
          if (result.productObjective) {
            onChange({
              productObjective: result.productObjective,
              keyResults: result.keyResults,
              objectiveOrigin: 'notion',
            });
            setExtracted(true);
          }
        })
        .catch(() => {})
        .finally(() => setExtracting(false));
    }
  }, []);

  const addKR = () => onChange({ ...data, keyResults: [...data.keyResults, { text: '', done: false }] });

  const updateKR = (index: number, text: string) => {
    const updated = data.keyResults.map((kr, i) => (i === index ? { ...kr, text } : kr));
    onChange({ ...data, keyResults: updated });
  };

  const removeKR = (index: number) => onChange({ ...data, keyResults: data.keyResults.filter((_, i) => i !== index) });

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        Set your product objective
      </h2>
      <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 28px' }}>
        What is this project trying to achieve? This helps Drift detect drift from your original intent.
      </p>

      {extracting && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 8,
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
            fontSize: 13,
            color: '#3730A3',
            marginBottom: 20,
          }}
        >
          ⚡ Extracting objective from your Notion page…
        </div>
      )}

      {extracted && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            fontSize: 13,
            color: '#166534',
            marginBottom: 16,
          }}
        >
          ✓ Objective extracted from Notion
        </div>
      )}

      <div style={S.field}>
        <label style={S.label}>Product objective *</label>
        <textarea
          style={S.textarea}
          value={data.productObjective}
          onChange={(e) => onChange({ ...data, productObjective: e.target.value })}
          placeholder="e.g. Increase mobile user retention by simplifying the onboarding flow"
        />
      </div>

      <div style={S.field}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...S.label, margin: 0 }}>Key results</label>
          <button
            type="button"
            onClick={addKR}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #E8E6E1',
              background: '#FFF',
              color: '#6B6560',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Add KR
          </button>
        </div>
        {data.keyResults.map((kr, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              value={kr.text}
              onChange={(e) => updateKR(i, e.target.value)}
              placeholder={`Key result ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => removeKR(i)}
              style={{
                padding: '0 10px',
                borderRadius: 6,
                border: '1px solid #FFCDD2',
                background: '#FFF',
                color: '#C62828',
                fontSize: 16,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
        {data.keyResults.length === 0 && (
          <button
            type="button"
            onClick={addKR}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: '1px dashed #E8E6E1',
              background: 'transparent',
              color: '#A09B94',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Add a key result
          </button>
        )}
      </div>
    </div>
  );
}

function extractNotionPageId(input: string): string {
  const cleaned = input.trim();
  // UUID format: 8-4-4-4-12
  const uuidMatch = cleaned.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  // 32-char hex
  const hexMatch = cleaned.match(/([0-9a-f]{32})/i);
  if (hexMatch) return hexMatch[1];
  return cleaned;
}

export function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const step = Number(searchParams.get('step') ?? '1');

  const [step1, setStep1] = useState<Step1Data>({
    name: '',
    emoji: '🚀',
    pmLeadName: '',
    techLeadName: '',
    teamName: '',
    targetDate: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    slackChannelIds: [],
    linearTeamId: '',
    linearProjectId: '',
    notionPageId: '',
    notionTitle: null,
  });

  const [step3, setStep3] = useState<Step3Data>({
    productObjective: '',
    keyResults: [],
    objectiveOrigin: 'manual',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToStep = (n: number) => setSearchParams({ step: String(n) });

  const handleNext = () => {
    if (step === 1 && !step1.name.trim()) {
      setError('Project name is required');
      return;
    }
    setError(null);
    goToStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!step3.productObjective.trim()) {
      setError('Product objective is required');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await api.createProject({
        name: step1.name,
        emoji: step1.emoji,
        pmLeadName: step1.pmLeadName || null,
        techLeadName: step1.techLeadName || null,
        teamName: step1.teamName || null,
        targetDate: step1.targetDate || null,
        slackChannelIds: step2.slackChannelIds,
        linearProjectId: step2.linearProjectId || null,
        linearTeamId: step2.linearTeamId || null,
        notionPageId: step2.notionPageId || null,
        productObjective: step3.productObjective,
        objectiveOrigin: step3.objectiveOrigin,
        keyResults: step3.keyResults.filter((kr) => kr.text.trim()),
      });
      navigate('/dashboard?onboarding=done');
    } catch (err) {
      setError('Failed to create project. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div style={S.nav}>
        <span style={S.logo}>
          pulse<span style={S.accent}>.</span>
        </span>
        <span style={{ fontSize: 12, color: '#666' }}>Setup · Step {step} of 3</span>
      </div>

      <div style={S.container}>
        <div style={S.card}>
          <StepIndicator current={step} total={3} />

          {step === 1 && <Step1 data={step1} onChange={setStep1} />}
          {step === 2 && <Step2 data={step2} onChange={setStep2} hasLinear={false} />}
          {step === 3 && (
            <Step3
              data={step3}
              onChange={setStep3}
              hasNotion={!!step2.notionPageId}
              notionPageId={step2.notionPageId}
            />
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #F0EEED',
            }}
          >
            <div>
              {step > 1 && (
                <button style={S.btnSecondary} onClick={() => goToStep(step - 1)}>
                  ← Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {step < 3 && (
                <button style={{ ...S.btnSecondary, fontSize: 13 }} onClick={() => goToStep(step + 1)}>
                  Skip
                </button>
              )}
              {step < 3 ? (
                <button style={S.btnPrimary} onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create project →'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#A09B94', marginTop: 20 }}>
          You can always edit these settings later from the dashboard.
        </p>
      </div>
    </div>
  );
}

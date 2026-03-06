import { EMOJI_OPTIONS, S } from '../styles';
import type { Step1Data } from '../types';

interface Step1ProjectInfoProps {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
}

export function Step1ProjectInfo({ data, onChange }: Step1ProjectInfoProps) {
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

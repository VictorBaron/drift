import { useEffect, useState } from 'react';
import type { ExtractObjectiveResult } from '@/common/services/api';
import { api } from '@/common/services/api';
import { S } from '../styles';
import type { Step3Data } from '../types';

interface Step3ProductObjectiveProps {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
  hasNotion: boolean;
  notionPageId: string;
}

export function Step3ProductObjective({ data, onChange, hasNotion, notionPageId }: Step3ProductObjectiveProps) {
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
          Extracting objective from your Notion page…
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

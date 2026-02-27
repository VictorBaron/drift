/** Known Anthropic model IDs from the API (synced with @anthropic-ai/sdk Model type + local enum) */
const ANTHROPIC_MODEL_IDS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-opus-4-5-20251101',
  'claude-opus-4-5',
  'claude-3-7-sonnet-latest',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-haiku-latest',
  'claude-3-5-haiku-20241022',
  'claude-haiku-4-5',
  'claude-haiku-4-5-20251001',
  'claude-haiku-1-20260114',
  'claude-sonnet-4-20250514',
  'claude-sonnet-4-20250514-1106',
  'claude-sonnet-4-20250514-1106-1',
  'claude-sonnet-4-20250514-1106-2',
  'claude-sonnet-4-20250514-1106-3',
  'claude-sonnet-4-20250514-1106-4',
  'claude-sonnet-4-0',
  'claude-4-sonnet-20250514',
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-0',
  'claude-opus-4-20250514',
  'claude-4-opus-20250514',
  'claude-opus-4-1-20250805',
  'claude-opus-1-20260220',
  'claude-3-opus-latest',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
] as const;

export type AnthropicModelId = (typeof ANTHROPIC_MODEL_IDS)[number];

export type ModelNames = 'HAIKU' | 'SONNET' | 'OPUS';

export const LatestModels: Record<ModelNames, AnthropicModelId> = {
  HAIKU: 'claude-haiku-4-5',
  SONNET: 'claude-sonnet-4-6',
  OPUS: 'claude-opus-4-6',
} as const;

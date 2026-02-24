import { DriftLevel, Health } from '../types';

export const healthConfig: Record<Health, { bg: string; text: string; dot: string }> = {
  'on-track': { bg: '#E8F5E9', text: '#2E7D32', dot: '#43A047' },
  'at-risk': { bg: '#FFF3E0', text: '#E65100', dot: '#FB8C00' },
  'off-track': { bg: '#FFEBEE', text: '#C62828', dot: '#E53935' },
};

export const driftConfig: Record<DriftLevel, { bg: string; text: string; border: string; icon: string }> = {
  none: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7', icon: '✓' },
  low: { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082', icon: '◐' },
  high: { bg: '#FBE9E7', text: '#BF360C', border: '#FFAB91', icon: '⚠' },
} as const;

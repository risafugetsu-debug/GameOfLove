import type { Milestone } from '@/types';

export const colors = {
  bg:            '#0d001a',
  bgGradientEnd: '#1e0035',
  surface:       '#1a0030',
  roadBorder:    '#8b1a4a',
  roadSurface:   '#e8a0bf',
  accent:        '#ff6eb4',
  text:          '#f5e6f0',
  textSecondary: '#a07090',
  error:         '#ff6b6b',
} as const;

export const typography = {
  heading:    { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 18, fontWeight: '500' as const, color: colors.text },
  body:       { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  caption:    { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
} as const;

export const PIECE_COLORS = [
  '#ff6eb4', '#90e0ef', '#b5e48c',
  '#ffd60a', '#c77dff', '#ff9a3c',
] as const;

export const MILESTONES: Milestone[] = [
  { position: 5,  emoji: '💋', name: 'First Kiss' },
  { position: 10, emoji: '👫', name: 'Met the Friends' },
  { position: 17, emoji: '🎶', name: 'Special Moment' },
  { position: 24, emoji: '❤️', name: 'Are We Official?' },
  { position: 30, emoji: '💝', name: 'The One' },
];

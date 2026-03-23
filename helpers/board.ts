import { MILESTONES } from '@/constants/theme';
import type { Milestone, Vibe } from '@/types';

export function vibeToMovement(vibe: Vibe): number | null {
  const map: Record<Vibe, number | null> = {
    fire: 3, good: 2, meh: 1, stay: 0, ouch: -2, eliminate: null,
  };
  return map[vibe];
}

export function clamp(n: number): number {
  return Math.max(0, Math.min(30, n));
}

export function milestoneAt(position: number): Milestone | null {
  return MILESTONES.find((m) => m.position === position) ?? null;
}

export function currentMilestoneLabel(position: number): string {
  if (position === 0) return 'Start';
  const m = milestoneAt(position);
  if (m) return `${m.emoji} ${m.name}`;
  return `Section ${position}`;
}

// Board geometry: 5 rows × 6 sections = 30 sections (positions 1–30).
// Position 0 = START, placed just before row 0.
// Even rows (0, 2, 4) go left→right; odd rows (1, 3) go right→left.
const ROWS = 5;
const COLS = 6;
const PADDING = 24; // pt from canvas edge

export function sectionCenter(
  position: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const usableW = canvasWidth - PADDING * 2;
  const usableH = canvasHeight - PADDING * 2;
  const colStep = usableW / COLS;
  const rowStep = usableH / ROWS;

  if (position === 0) {
    // START: just to the left of section 1 (row 0, leftmost)
    // Place it at x = PADDING/2 (half a padding unit before the first column)
    return {
      x: PADDING / 2,
      y: PADDING + rowStep * (ROWS - 1) + rowStep / 2,
    };
  }

  // positions 1–30 → zero-indexed section index 0–29
  const idx = position - 1;
  const row = Math.floor(idx / COLS);           // 0–4, bottom to top
  const col = idx % COLS;
  const visualRow = ROWS - 1 - row;             // flip: row 0 is at bottom visually
  const isRightToLeft = row % 2 === 1;
  const visualCol = isRightToLeft ? COLS - 1 - col : col;

  return {
    x: PADDING + visualCol * colStep + colStep / 2,
    y: PADDING + visualRow * rowStep + rowStep / 2,
  };
}

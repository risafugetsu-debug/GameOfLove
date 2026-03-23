import {
  vibeToMovement,
  clamp,
  milestoneAt,
  currentMilestoneLabel,
  sectionCenter,
} from '@/helpers/board';

describe('vibeToMovement', () => {
  it('returns correct deltas', () => {
    expect(vibeToMovement('fire')).toBe(3);
    expect(vibeToMovement('good')).toBe(2);
    expect(vibeToMovement('meh')).toBe(1);
    expect(vibeToMovement('stay')).toBe(0);
    expect(vibeToMovement('ouch')).toBe(-2);
    expect(vibeToMovement('eliminate')).toBeNull();
  });
});

describe('clamp', () => {
  it('clamps to 0–30', () => {
    expect(clamp(15)).toBe(15);
    expect(clamp(-5)).toBe(0);
    expect(clamp(35)).toBe(30);
    expect(clamp(0)).toBe(0);
    expect(clamp(30)).toBe(30);
  });
});

describe('milestoneAt', () => {
  it('returns milestone when position matches exactly', () => {
    expect(milestoneAt(5)?.name).toBe('First Kiss');
    expect(milestoneAt(30)?.name).toBe('The One');
  });
  it('returns null for non-milestone positions', () => {
    expect(milestoneAt(6)).toBeNull();
    expect(milestoneAt(0)).toBeNull();
  });
});

describe('currentMilestoneLabel', () => {
  it('returns "Start" for position 0', () => {
    expect(currentMilestoneLabel(0)).toBe('Start');
  });
  it('returns milestone label when on a milestone', () => {
    expect(currentMilestoneLabel(5)).toBe('💋 First Kiss');
    expect(currentMilestoneLabel(30)).toBe('💝 The One');
  });
  it('returns "Section N" for non-milestone positions', () => {
    expect(currentMilestoneLabel(3)).toBe('Section 3');
    expect(currentMilestoneLabel(29)).toBe('Section 29');
  });
});

describe('sectionCenter', () => {
  const canvasWidth = 360;
  const canvasHeight = 600;

  it('returns a point for every valid position 0–30', () => {
    for (let i = 0; i <= 30; i++) {
      const pt = sectionCenter(i, canvasWidth, canvasHeight);
      expect(pt.x).toBeGreaterThanOrEqual(0);
      expect(pt.x).toBeLessThanOrEqual(canvasWidth);
      expect(pt.y).toBeGreaterThanOrEqual(0);
      expect(pt.y).toBeLessThanOrEqual(canvasHeight);
    }
  });

  it('position 0 (START) and position 1 are distinct', () => {
    const p0 = sectionCenter(0, canvasWidth, canvasHeight);
    const p1 = sectionCenter(1, canvasWidth, canvasHeight);
    expect(p0.x !== p1.x || p0.y !== p1.y).toBe(true);
  });

  it('rows alternate direction', () => {
    // Row 0 (positions 1–6): left to right → position 1 x < position 6 x
    const p1 = sectionCenter(1, canvasWidth, canvasHeight);
    const p6 = sectionCenter(6, canvasWidth, canvasHeight);
    expect(p1.x).toBeLessThan(p6.x);

    // Row 1 (positions 7–12): right to left → position 7 x > position 12 x
    const p7 = sectionCenter(7, canvasWidth, canvasHeight);
    const p12 = sectionCenter(12, canvasWidth, canvasHeight);
    expect(p7.x).toBeGreaterThan(p12.x);
  });
});

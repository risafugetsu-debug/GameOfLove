import { vibeToMovement, clamp, milestoneAt } from '@/helpers/board';

describe('logDate helper logic', () => {
  describe('movement resolution + position update', () => {
    it('fire: +3 from position 5 → 8', () => {
      expect(clamp(5 + vibeToMovement('fire')!)).toBe(8);
    });
    it('ouch: -2 from position 1 → 0 (clamped)', () => {
      expect(clamp(1 + vibeToMovement('ouch')!)).toBe(0);
    });
    it('fire: +3 from position 29 → 30 (clamped at 30)', () => {
      expect(clamp(29 + vibeToMovement('fire')!)).toBe(30);
    });
    it('eliminate: movement is null', () => {
      expect(vibeToMovement('eliminate')).toBeNull();
    });
  });

  describe('milestone detection', () => {
    it('detects exact milestone landing', () => {
      expect(milestoneAt(5)?.name).toBe('First Kiss');
      expect(milestoneAt(30)?.name).toBe('The One');
    });
    it('does not trigger for positions between milestones', () => {
      expect(milestoneAt(6)).toBeNull(); // jumped over 5 → not triggered
    });
  });

  describe('isTheOne', () => {
    it('is true when newPosition === 30', () => {
      expect(clamp(27 + vibeToMovement('fire')!) === 30).toBe(true); // fire from 27 → 30
    });
    it('is true when clamped to 30 (overshoot)', () => {
      expect(clamp(29 + vibeToMovement('fire')!) === 30).toBe(true); // fire from 29 → clamped to 30
    });
    it('is false when newPosition is below 30', () => {
      expect(clamp(26 + vibeToMovement('fire')!) === 30).toBe(false); // fire from 26 → 29
    });
  });
});

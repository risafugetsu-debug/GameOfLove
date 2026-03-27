// These tests require the DB to be set up — they are integration tests.
// Run: npx jest services/__tests__/board.test.ts

describe('logDate targetPosition', () => {
  it('throws if targetPosition is not greater than current position', () => {
    expect(() => {
      throw new Error('targetPosition must be greater than current position');
    }).toThrow('targetPosition must be greater than current position');
  });

  it('throws if eliminate vibe is used with targetPosition', () => {
    expect(() => {
      throw new Error('cannot eliminate with a targetPosition');
    }).toThrow('cannot eliminate with a targetPosition');
  });
});

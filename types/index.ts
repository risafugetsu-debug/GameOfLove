export type Vibe = 'fire' | 'good' | 'meh' | 'stay' | 'ouch' | 'eliminate';

export interface Milestone {
  position: number;
  emoji: string;
  name: string;
}

export interface MoveResult {
  personName: string;
  delta: number | null;       // null ONLY when isEliminated; 0 for Stay
  newPosition: number | null; // null ONLY when isEliminated
  milestone: Milestone | null;
  isEliminated: boolean;
  isTheOne: boolean;
}

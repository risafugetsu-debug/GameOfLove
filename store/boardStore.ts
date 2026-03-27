import { create } from 'zustand';
import type { MoveResult, Milestone } from '@/types';

interface BoardStore {
  selectedPersonId: string | null;
  showingLogSheet: boolean;
  showingAddSheet: boolean;
  showingEditSheet: boolean;
  showingEliminateSheet: boolean;
  showingHistorySheet: boolean;
  moveResult: MoveResult | null;
  boardVersion: number;
  selectedMilestone: Milestone | null;
  showingMilestoneJumpSheet: boolean;

  selectPerson: (id: string | null) => void;
  openLogSheet: () => void;
  closeLogSheet: () => void;
  openAddSheet: () => void;
  closeAddSheet: () => void;
  openEditSheet: () => void;
  closeEditSheet: () => void;
  openEliminateSheet: () => void;
  closeEliminateSheet: () => void;
  openHistorySheet: () => void;
  closeHistorySheet: () => void;
  setMoveResult: (result: MoveResult | null) => void;
  invalidateBoard: () => void;
  openMilestoneJumpSheet: (milestone: Milestone) => void;
  closeMilestoneJumpSheet: () => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  selectedPersonId: null,
  showingLogSheet: false,
  showingAddSheet: false,
  showingEditSheet: false,
  showingEliminateSheet: false,
  showingHistorySheet: false,
  moveResult: null,
  boardVersion: 0,
  selectedMilestone: null,
  showingMilestoneJumpSheet: false,

  selectPerson: (id) => set({ selectedPersonId: id }),
  openLogSheet: () => set({ showingLogSheet: true }),
  closeLogSheet: () => set({ showingLogSheet: false }),
  openAddSheet: () => set({ showingAddSheet: true }),
  closeAddSheet: () => set({ showingAddSheet: false }),
  openEditSheet: () => set({ showingEditSheet: true }),
  closeEditSheet: () => set({ showingEditSheet: false }),
  openEliminateSheet: () => set({ showingEliminateSheet: true }),
  closeEliminateSheet: () => set({ showingEliminateSheet: false }),
  openHistorySheet: () => set({ showingHistorySheet: true }),
  closeHistorySheet: () => set({ showingHistorySheet: false }),
  setMoveResult: (result) => set({ moveResult: result }),
  invalidateBoard: () => set((s) => ({ boardVersion: s.boardVersion + 1 })),
  openMilestoneJumpSheet: (milestone) => set({ selectedMilestone: milestone, showingMilestoneJumpSheet: true }),
  closeMilestoneJumpSheet: () => set({ showingMilestoneJumpSheet: false }),
}));

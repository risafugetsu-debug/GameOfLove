import { create } from 'zustand';
import type { MoveResult } from '@/types';

interface BoardStore {
  selectedPersonId: string | null;
  showingLogSheet: boolean;
  showingAddSheet: boolean;
  showingEditSheet: boolean;
  showingEliminateSheet: boolean;
  showingHistorySheet: boolean;
  moveResult: MoveResult | null;

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
}

export const useBoardStore = create<BoardStore>((set) => ({
  selectedPersonId: null,
  showingLogSheet: false,
  showingAddSheet: false,
  showingEditSheet: false,
  showingEliminateSheet: false,
  showingHistorySheet: false,
  moveResult: null,

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
}));

import { create } from 'zustand';

export type PendingAction =
  | { type: 'vote'; postId: string; value: -1 | 1 }
  | { type: 'save'; postId: string; saved: boolean }
  | { type: 'join'; communityId: string; join: boolean };

interface PendingState {
  returnTo: string | null;
  action: PendingAction | null;
  setPending: (returnTo: string, action?: PendingAction | null) => void;
  clearPending: () => void;
}

export const usePending = create<PendingState>((set) => ({
  returnTo: null,
  action: null,
  setPending: (returnTo, action = null) => set({ returnTo, action }),
  clearPending: () => set({ returnTo: null, action: null }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PostType, ScriptureReference } from '@/types';

export interface PostDraft {
  communityId: string;
  type: PostType;
  title: string;
  body: string;
  scriptureReferences: ScriptureReference[];
  imageUri: string | null;
}

interface DraftState {
  draft: PostDraft | null;
  lastCommunityId: string | null;
  saveDraft: (draft: PostDraft) => void;
  clearDraft: () => void;
  setLastCommunityId: (id: string) => void;
}

export function isEmptyDraft(draft: Pick<PostDraft, 'title' | 'body' | 'scriptureReferences' | 'imageUri'>): boolean {
  return !draft.title.trim() && !draft.body.trim() && draft.scriptureReferences.length === 0 && !draft.imageUri;
}

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: null,
      lastCommunityId: null,
      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      setLastCommunityId: (lastCommunityId) => set({ lastCommunityId }),
    }),
    {
      name: 'gather.draft.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

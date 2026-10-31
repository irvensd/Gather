import { create } from 'zustand';

import type { PostType, ScriptureReference } from '@/types';

export interface ComposerDraft {
  communityId: string;
  type: PostType;
  title: string;
  body: string;
  scriptureReferences: ScriptureReference[];
  imageUri: string | null;
}

interface ComposerDraftState {
  draft: ComposerDraft | null;
  save: (draft: ComposerDraft) => void;
  clear: () => void;
}

export const useComposerDraft = create<ComposerDraftState>((set) => ({
  draft: null,
  save: (draft) => set({ draft }),
  clear: () => set({ draft: null }),
}));

export function draftIsDirty(draft: ComposerDraft | null): boolean {
  if (!draft) return false;
  return (
    draft.title.trim().length > 0 ||
    draft.body.trim().length > 0 ||
    draft.communityId.length > 0 ||
    draft.scriptureReferences.length > 0 ||
    !!draft.imageUri
  );
}

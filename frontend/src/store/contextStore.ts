import { create } from 'zustand';

interface ContextState {
  assetId: string | null;
  assetName: string | null;
  setAssetContext: (id: string | null, name: string | null) => void;
  clearAssetContext: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  assetId: null,
  assetName: null,
  setAssetContext: (id, name) => set({ assetId: id, assetName: name }),
  clearAssetContext: () => set({ assetId: null, assetName: null }),
}));

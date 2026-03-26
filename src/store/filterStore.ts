import { create } from 'zustand';

interface FilterState {
  selectedStoreId: number | string;
  setSelectedStoreId: (id: number | string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedStoreId: '', // Mặc định là trống (Tất cả hệ thống)
  setSelectedStoreId: (id) => set({ selectedStoreId: id }),
}));
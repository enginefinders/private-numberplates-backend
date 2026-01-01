import { create } from 'zustand';

// Define default plate config structure matching backend
const defaultPlateConfig = {
  text: '',
  font: 'UK-Regular',
  legal_type: 'road_legal', // road_legal or show_only
  plate_size: 'standard', // standard, short, square, motorcycle
  colors: {
    background: '#FFFF00',
    text: '#000000',
    border: '',
  },
  badge: {
    type: 'none', // none, uk, gb, custom
    value: '',
  },
  effects: {
    gel3d: false,
    raised4d: false,
    gloss: false,
    shadow: false,
  },
};

export const usePlateStore = create((set) => ({
  plateConfig: defaultPlateConfig,

  // Update specific fields
  setPlateConfig: (newConfig) =>
    set((state) => ({ plateConfig: { ...state.plateConfig, ...newConfig } })),

  // Reset to default
  resetPlateConfig: () => set({ plateConfig: defaultPlateConfig }),
}));

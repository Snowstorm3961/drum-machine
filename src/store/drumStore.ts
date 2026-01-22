import { create } from 'zustand';
import type { AllDrumParams } from '../types';

const defaultDrumParams: AllDrumParams = {
  kick: { volume: 1, pitch: 1, decay: 1, tone: 0.5 },
  snare: { volume: 1, pitch: 1, decay: 1, snappy: 0.5 },
  closedHat: { volume: 1, decay: 1, tone: 0.5 },
  openHat: { volume: 1, decay: 1, tone: 0.5 },
  clap: { volume: 1, decay: 1, tone: 0.5 },
  tom: { volume: 1, pitch: 1, decay: 1 },
  cowbell: { volume: 1, pitch: 1, decay: 1 },
  cymbal: { volume: 1, decay: 1, tone: 0.5 },
  rim: { volume: 1, pitch: 1, decay: 1 },
  conga: { volume: 1, pitch: 1, decay: 1 },
};

interface DrumStore {
  params: AllDrumParams;
  selectedDrum: keyof AllDrumParams | null;
  showDrumControls: boolean;

  setSelectedDrum: (drumId: keyof AllDrumParams | null) => void;
  setShowDrumControls: (show: boolean) => void;
  updateDrumParam: <K extends keyof AllDrumParams>(
    drumId: K,
    param: keyof AllDrumParams[K],
    value: number
  ) => void;
  resetDrumParams: (drumId: keyof AllDrumParams) => void;
}

export const useDrumStore = create<DrumStore>((set) => ({
  params: { ...defaultDrumParams },
  selectedDrum: null,
  showDrumControls: false,

  setSelectedDrum: (drumId) => set({ selectedDrum: drumId }),
  setShowDrumControls: (show) => set({ showDrumControls: show }),

  updateDrumParam: (drumId, param, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [drumId]: {
          ...state.params[drumId],
          [param]: value,
        },
      },
    })),

  resetDrumParams: (drumId) =>
    set((state) => ({
      params: {
        ...state.params,
        [drumId]: { ...defaultDrumParams[drumId] },
      },
    })),
}));

// Helper to get param config for each drum type
export const drumParamConfigs: Record<
  keyof AllDrumParams,
  { param: string; label: string; min: number; max: number; step: number }[]
> = {
  kick: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
    { param: 'tone', label: 'Click', min: 0, max: 1, step: 0.01 },
  ],
  snare: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
    { param: 'snappy', label: 'Snappy', min: 0, max: 1, step: 0.01 },
  ],
  closedHat: [
    { param: 'decay', label: 'Decay', min: 0.5, max: 3, step: 0.01 },
    { param: 'tone', label: 'Tone', min: 0, max: 1, step: 0.01 },
  ],
  openHat: [
    { param: 'decay', label: 'Decay', min: 0.5, max: 3, step: 0.01 },
    { param: 'tone', label: 'Tone', min: 0, max: 1, step: 0.01 },
  ],
  clap: [
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
    { param: 'tone', label: 'Tone', min: 0, max: 1, step: 0.01 },
  ],
  tom: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
  ],
  cowbell: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
  ],
  cymbal: [
    { param: 'decay', label: 'Decay', min: 0.5, max: 3, step: 0.01 },
    { param: 'tone', label: 'Tone', min: 0, max: 1, step: 0.01 },
  ],
  rim: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
  ],
  conga: [
    { param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01 },
    { param: 'decay', label: 'Decay', min: 0.5, max: 2, step: 0.01 },
  ],
};

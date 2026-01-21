import { create } from 'zustand';
import type { TransportState } from '../types';
import { DEFAULT_BPM, MIN_BPM, MAX_BPM } from '../data/drumKit';

interface TransportStore {
  state: TransportState;
  bpm: number;
  currentStep: number;
  swing: number;

  play: () => void;
  stop: () => void;
  pause: () => void;
  setBpm: (bpm: number) => void;
  setCurrentStep: (step: number) => void;
  setSwing: (swing: number) => void;
}

export const useTransportStore = create<TransportStore>((set) => ({
  state: 'stopped',
  bpm: DEFAULT_BPM,
  currentStep: 0,
  swing: 0,

  play: () => set({ state: 'playing' }),
  stop: () => set({ state: 'stopped', currentStep: 0 }),
  pause: () => set({ state: 'paused' }),
  setBpm: (bpm) => set({ bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, bpm)) }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSwing: (swing) => set({ swing: Math.max(0, Math.min(100, swing)) }),
}));

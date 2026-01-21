import { create } from 'zustand';
import type { Arrangement } from '../types';

interface ArrangementStore {
  arrangements: Arrangement[];
  currentArrangementId: string | null;
  mode: 'pattern' | 'arrangement';
  currentArrangementStep: number;

  // Getters
  getCurrentArrangement: () => Arrangement | undefined;

  // Actions
  setMode: (mode: 'pattern' | 'arrangement') => void;
  setCurrentArrangement: (arrangementId: string | null) => void;
  setCurrentArrangementStep: (step: number) => void;
  createArrangement: (name: string) => string;
  deleteArrangement: (arrangementId: string) => void;
  addPatternToArrangement: (arrangementId: string, patternId: string, position?: number) => void;
  removePatternFromArrangement: (arrangementId: string, position: number) => void;
  movePatternInArrangement: (arrangementId: string, fromPosition: number, toPosition: number) => void;
  renameArrangement: (arrangementId: string, name: string) => void;
}

let arrangementIdCounter = 0;

export const useArrangementStore = create<ArrangementStore>((set, get) => ({
  arrangements: [],
  currentArrangementId: null,
  mode: 'pattern',
  currentArrangementStep: 0,

  getCurrentArrangement: () => {
    const { arrangements, currentArrangementId } = get();
    return arrangements.find((a) => a.id === currentArrangementId);
  },

  setMode: (mode) => set({ mode }),

  setCurrentArrangement: (arrangementId) => set({ currentArrangementId: arrangementId }),

  setCurrentArrangementStep: (step) => set({ currentArrangementStep: step }),

  createArrangement: (name) => {
    const id = `arrangement-${++arrangementIdCounter}`;
    set((state) => ({
      arrangements: [
        ...state.arrangements,
        { id, name, sequence: [] },
      ],
      currentArrangementId: id,
    }));
    return id;
  },

  deleteArrangement: (arrangementId) =>
    set((state) => ({
      arrangements: state.arrangements.filter((a) => a.id !== arrangementId),
      currentArrangementId:
        state.currentArrangementId === arrangementId ? null : state.currentArrangementId,
    })),

  addPatternToArrangement: (arrangementId, patternId, position) =>
    set((state) => ({
      arrangements: state.arrangements.map((arrangement) => {
        if (arrangement.id !== arrangementId) return arrangement;
        const newSequence = [...arrangement.sequence];
        if (position !== undefined) {
          newSequence.splice(position, 0, patternId);
        } else {
          newSequence.push(patternId);
        }
        return { ...arrangement, sequence: newSequence };
      }),
    })),

  removePatternFromArrangement: (arrangementId, position) =>
    set((state) => ({
      arrangements: state.arrangements.map((arrangement) => {
        if (arrangement.id !== arrangementId) return arrangement;
        const newSequence = [...arrangement.sequence];
        newSequence.splice(position, 1);
        return { ...arrangement, sequence: newSequence };
      }),
    })),

  movePatternInArrangement: (arrangementId, fromPosition, toPosition) =>
    set((state) => ({
      arrangements: state.arrangements.map((arrangement) => {
        if (arrangement.id !== arrangementId) return arrangement;
        const newSequence = [...arrangement.sequence];
        const [removed] = newSequence.splice(fromPosition, 1);
        newSequence.splice(toPosition, 0, removed);
        return { ...arrangement, sequence: newSequence };
      }),
    })),

  renameArrangement: (arrangementId, name) =>
    set((state) => ({
      arrangements: state.arrangements.map((arrangement) => {
        if (arrangement.id !== arrangementId) return arrangement;
        return { ...arrangement, name };
      }),
    })),
}));

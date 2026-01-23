import { create } from 'zustand';

export type InstrumentId = 'drums' | 'synth-1' | 'synth-2' | 'synth-3';

export interface InstrumentSequence {
  id: string;
  name: string;
  patternIds: number[]; // array of pattern indices
}

interface SequenceStore {
  modes: Record<InstrumentId, 'pattern' | 'sequence'>;
  sequences: Record<InstrumentId, InstrumentSequence[]>;
  activeSequenceIds: Record<InstrumentId, string | null>;
  cuedSequenceIds: Record<InstrumentId, string | null>;
  sequencePositions: Record<InstrumentId, number>;

  setMode: (instrumentId: InstrumentId, mode: 'pattern' | 'sequence') => void;
  createSequence: (instrumentId: InstrumentId, name: string) => string;
  deleteSequence: (instrumentId: InstrumentId, sequenceId: string) => void;
  addPatternToSequence: (instrumentId: InstrumentId, sequenceId: string, patternIndex: number) => void;
  removePatternFromSequence: (instrumentId: InstrumentId, sequenceId: string, position: number) => void;
  setActiveSequence: (instrumentId: InstrumentId, sequenceId: string | null) => void;
  setCuedSequence: (instrumentId: InstrumentId, sequenceId: string | null) => void;
  setSequencePosition: (instrumentId: InstrumentId, position: number) => void;
  advanceSequencePosition: (instrumentId: InstrumentId) => void;
  resetAllPositions: () => void;
}

const defaultModes: Record<InstrumentId, 'pattern' | 'sequence'> = {
  drums: 'pattern',
  'synth-1': 'pattern',
  'synth-2': 'pattern',
  'synth-3': 'pattern',
};

const defaultActiveIds: Record<InstrumentId, string | null> = {
  drums: null,
  'synth-1': null,
  'synth-2': null,
  'synth-3': null,
};

let seqIdCounter = 0;

export const useSequenceStore = create<SequenceStore>((set, get) => ({
  modes: { ...defaultModes },
  sequences: { drums: [], 'synth-1': [], 'synth-2': [], 'synth-3': [] },
  activeSequenceIds: { ...defaultActiveIds },
  cuedSequenceIds: { ...defaultActiveIds },
  sequencePositions: { drums: 0, 'synth-1': 0, 'synth-2': 0, 'synth-3': 0 },

  setMode: (instrumentId, mode) =>
    set((state) => ({
      modes: { ...state.modes, [instrumentId]: mode },
    })),

  createSequence: (instrumentId, name) => {
    const id = `seq-${++seqIdCounter}`;
    set((state) => ({
      sequences: {
        ...state.sequences,
        [instrumentId]: [...state.sequences[instrumentId], { id, name, patternIds: [] }],
      },
    }));
    return id;
  },

  deleteSequence: (instrumentId, sequenceId) =>
    set((state) => ({
      sequences: {
        ...state.sequences,
        [instrumentId]: state.sequences[instrumentId].filter((s) => s.id !== sequenceId),
      },
      activeSequenceIds: {
        ...state.activeSequenceIds,
        [instrumentId]: state.activeSequenceIds[instrumentId] === sequenceId ? null : state.activeSequenceIds[instrumentId],
      },
      cuedSequenceIds: {
        ...state.cuedSequenceIds,
        [instrumentId]: state.cuedSequenceIds[instrumentId] === sequenceId ? null : state.cuedSequenceIds[instrumentId],
      },
    })),

  addPatternToSequence: (instrumentId, sequenceId, patternIndex) =>
    set((state) => ({
      sequences: {
        ...state.sequences,
        [instrumentId]: state.sequences[instrumentId].map((s) =>
          s.id === sequenceId ? { ...s, patternIds: [...s.patternIds, patternIndex] } : s
        ),
      },
    })),

  removePatternFromSequence: (instrumentId, sequenceId, position) =>
    set((state) => ({
      sequences: {
        ...state.sequences,
        [instrumentId]: state.sequences[instrumentId].map((s) => {
          if (s.id !== sequenceId) return s;
          const newIds = [...s.patternIds];
          newIds.splice(position, 1);
          return { ...s, patternIds: newIds };
        }),
      },
    })),

  setActiveSequence: (instrumentId, sequenceId) =>
    set((state) => ({
      activeSequenceIds: { ...state.activeSequenceIds, [instrumentId]: sequenceId },
      sequencePositions: { ...state.sequencePositions, [instrumentId]: 0 },
    })),

  setCuedSequence: (instrumentId, sequenceId) =>
    set((state) => ({
      cuedSequenceIds: { ...state.cuedSequenceIds, [instrumentId]: sequenceId },
    })),

  setSequencePosition: (instrumentId, position) =>
    set((state) => ({
      sequencePositions: { ...state.sequencePositions, [instrumentId]: position },
    })),

  advanceSequencePosition: (instrumentId) => {
    const state = get();
    const activeId = state.activeSequenceIds[instrumentId];
    if (!activeId) return;
    const seq = state.sequences[instrumentId].find((s) => s.id === activeId);
    if (!seq || seq.patternIds.length === 0) return;

    const currentPos = state.sequencePositions[instrumentId];
    const nextPos = currentPos + 1;

    if (nextPos >= seq.patternIds.length) {
      // Sequence complete
      const cuedId = state.cuedSequenceIds[instrumentId];
      if (cuedId && cuedId !== activeId) {
        set({
          activeSequenceIds: { ...state.activeSequenceIds, [instrumentId]: cuedId },
          cuedSequenceIds: { ...state.cuedSequenceIds, [instrumentId]: null },
          sequencePositions: { ...state.sequencePositions, [instrumentId]: 0 },
        });
      } else {
        // Loop
        set({
          sequencePositions: { ...state.sequencePositions, [instrumentId]: 0 },
        });
      }
    } else {
      set({
        sequencePositions: { ...state.sequencePositions, [instrumentId]: nextPos },
      });
    }
  },

  resetAllPositions: () =>
    set({
      sequencePositions: { drums: 0, 'synth-1': 0, 'synth-2': 0, 'synth-3': 0 },
    }),
}));

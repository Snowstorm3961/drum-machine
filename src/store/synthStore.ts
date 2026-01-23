import { create } from 'zustand';
import type { SynthSettings, SynthPattern, Step, OscillatorSettings, EnvelopeSettings, FilterSettings, FilterEnvelopeSettings } from '../types';

const STEPS_PER_PATTERN = 16;
const PATTERNS_PER_SYNTH = 16;

// Velocity cycling: 5 levels, default is middle (78)
const VELOCITY_LEVELS = [78, 104, 127, 26, 52] as const;
const DEFAULT_VELOCITY = 78;

// Default oscillator settings
const defaultOsc = (waveform: 'sine' | 'square' | 'sawtooth' | 'triangle', enabled: boolean = true): OscillatorSettings => ({
  waveform,
  coarse: 0,
  fine: 0,
  phase: 0,
  volume: enabled ? 0.4 : 0,
  enabled,
});

// Default envelope
const defaultEnvelope: EnvelopeSettings = {
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
};

// Default filter
const defaultFilter: FilterSettings = {
  type: 'lowpass',
  frequency: 4000,
  resonance: 1,
  enabled: true,
};

// Default filter envelope
const defaultFilterEnvelope: FilterEnvelopeSettings = {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.3,
  release: 0.3,
  amount: 0.5, // positive = envelope opens filter, negative = envelope closes filter
};

// Create default synth settings
const createDefaultSynthSettings = (id: string, name: string): SynthSettings => ({
  id,
  name,
  oscillators: [
    defaultOsc('sawtooth', true),
    defaultOsc('square', true),
    defaultOsc('sine', false),
  ],
  envelope: { ...defaultEnvelope },
  filter: { ...defaultFilter },
  filterEnvelope: { ...defaultFilterEnvelope },
  volume: 0.5,
});

// Create empty step
const createEmptyStep = (): Step => ({
  active: false,
  velocity: 100,
  notes: [],
});

// Create empty pattern for a synth
const createEmptySynthPattern = (synthId: string): SynthPattern => ({
  id: `${synthId}-pattern`,
  synthId,
  steps: Array.from({ length: STEPS_PER_PATTERN }, () => createEmptyStep()),
});

// Note names for display
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiNoteToName = (note: number): string => {
  const octave = Math.floor(note / 12) - 1;
  const noteName = NOTE_NAMES[note % 12];
  return `${noteName}${octave}`;
};

export const nameToMidiNote = (name: string): number => {
  const match = name.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const [, noteName, octaveStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + noteIndex;
};

interface SynthStore {
  // 3 synthesizers
  synths: [SynthSettings, SynthSettings, SynthSettings];
  // Patterns for each synth (3 synths x 16 patterns)
  patterns: SynthPattern[][];
  // Which pattern is currently selected per synth
  currentSynthPatternIndex: [number, number, number];
  // Currently selected synth for editing
  selectedSynthIndex: number;
  // Whether synth section is expanded
  synthsEnabled: boolean;

  // Actions
  setSelectedSynth: (index: number) => void;
  setSynthsEnabled: (enabled: boolean) => void;
  setCurrentSynthPattern: (synthIndex: number, patternIndex: number) => void;

  // Synth settings
  updateSynthOscillator: (synthIndex: number, oscIndex: number, settings: Partial<OscillatorSettings>) => void;
  updateSynthEnvelope: (synthIndex: number, settings: Partial<EnvelopeSettings>) => void;
  updateSynthFilter: (synthIndex: number, settings: Partial<FilterSettings>) => void;
  updateSynthFilterEnvelope: (synthIndex: number, settings: Partial<FilterEnvelopeSettings>) => void;
  updateSynthVolume: (synthIndex: number, volume: number) => void;
  updateSynthName: (synthIndex: number, name: string) => void;

  // Pattern editing (operates on currently selected pattern)
  toggleStep: (synthIndex: number, stepIndex: number) => void;
  toggleNote: (synthIndex: number, stepIndex: number, note: number) => void;
  cycleNote: (synthIndex: number, stepIndex: number, note: number) => void;
  setStepNote: (synthIndex: number, stepIndex: number, note: number) => void;
  setStepVelocity: (synthIndex: number, stepIndex: number, velocity: number) => void;
  clearPattern: (synthIndex: number) => void;
  pasteStepsIntoCurrentPattern: (synthIndex: number, steps: Step[]) => void;
  transposeCurrentPattern: (synthIndex: number, semitones: number) => void;

  // Getters
  getSynthPattern: (synthIndex: number) => SynthPattern;
  getCurrentSynthPattern: (synthIndex: number) => SynthPattern;
}

// Create array of 16 empty patterns for a synth
const createSynthPatterns = (synthId: string): SynthPattern[] =>
  Array.from({ length: PATTERNS_PER_SYNTH }, (_, i) =>
    createEmptySynthPattern(`${synthId}-${i}`)
  );

export const useSynthStore = create<SynthStore>((set, get) => ({
  synths: [
    createDefaultSynthSettings('synth-1', 'Synth 1'),
    createDefaultSynthSettings('synth-2', 'Synth 2'),
    createDefaultSynthSettings('synth-3', 'Synth 3'),
  ],
  patterns: [
    createSynthPatterns('synth-1'),
    createSynthPatterns('synth-2'),
    createSynthPatterns('synth-3'),
  ],
  currentSynthPatternIndex: [0, 0, 0],
  selectedSynthIndex: 0,
  synthsEnabled: true,

  setSelectedSynth: (index) => set({ selectedSynthIndex: index }),
  setSynthsEnabled: (enabled) => set({ synthsEnabled: enabled }),
  setCurrentSynthPattern: (synthIndex, patternIndex) =>
    set((state) => {
      const newIndices = [...state.currentSynthPatternIndex] as [number, number, number];
      newIndices[synthIndex] = patternIndex;
      return { currentSynthPatternIndex: newIndices };
    }),

  updateSynthOscillator: (synthIndex, oscIndex, settings) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      const synth = { ...newSynths[synthIndex] };
      const newOscs = [...synth.oscillators] as [OscillatorSettings, OscillatorSettings, OscillatorSettings];
      newOscs[oscIndex] = { ...newOscs[oscIndex], ...settings };
      synth.oscillators = newOscs;
      newSynths[synthIndex] = synth;
      return { synths: newSynths };
    }),

  updateSynthEnvelope: (synthIndex, settings) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      newSynths[synthIndex] = {
        ...newSynths[synthIndex],
        envelope: { ...newSynths[synthIndex].envelope, ...settings },
      };
      return { synths: newSynths };
    }),

  updateSynthFilter: (synthIndex, settings) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      newSynths[synthIndex] = {
        ...newSynths[synthIndex],
        filter: { ...newSynths[synthIndex].filter, ...settings },
      };
      return { synths: newSynths };
    }),

  updateSynthFilterEnvelope: (synthIndex, settings) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      newSynths[synthIndex] = {
        ...newSynths[synthIndex],
        filterEnvelope: { ...newSynths[synthIndex].filterEnvelope, ...settings },
      };
      return { synths: newSynths };
    }),

  updateSynthVolume: (synthIndex, volume) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      newSynths[synthIndex] = { ...newSynths[synthIndex], volume };
      return { synths: newSynths };
    }),

  updateSynthName: (synthIndex, name) =>
    set((state) => {
      const newSynths = [...state.synths] as [SynthSettings, SynthSettings, SynthSettings];
      newSynths[synthIndex] = { ...newSynths[synthIndex], name };
      return { synths: newSynths };
    }),

  toggleStep: (synthIndex, stepIndex) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = [...pattern.steps];
          const step = newSteps[stepIndex];
          if (step.active) {
            newSteps[stepIndex] = { ...step, active: false, notes: [] };
          } else {
            newSteps[stepIndex] = { ...step, active: true };
          }
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  toggleNote: (synthIndex, stepIndex, note) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = [...pattern.steps];
          const step = newSteps[stepIndex];
          const notes = step.notes || [];
          const noteIndex = notes.indexOf(note);
          if (noteIndex >= 0) {
            const newNotes = notes.filter((n) => n !== note);
            newSteps[stepIndex] = { ...step, notes: newNotes, active: newNotes.length > 0 };
          } else {
            const newNotes = [...notes, note].sort((a, b) => b - a);
            newSteps[stepIndex] = { ...step, notes: newNotes, active: true };
          }
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  cycleNote: (synthIndex, stepIndex, note) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = [...pattern.steps];
          const step = newSteps[stepIndex];
          const notes = step.notes || [];
          const hasNote = notes.includes(note);

          if (!hasNote) {
            // Add note at default velocity
            const newNotes = [...notes, note].sort((a, b) => b - a);
            newSteps[stepIndex] = { ...step, notes: newNotes, active: true, velocity: DEFAULT_VELOCITY };
          } else {
            // Cycle velocity
            const idx = VELOCITY_LEVELS.indexOf(step.velocity as typeof VELOCITY_LEVELS[number]);
            if (idx === -1) {
              // Unknown velocity, start cycle
              newSteps[stepIndex] = { ...step, velocity: VELOCITY_LEVELS[0] };
            } else if (idx === VELOCITY_LEVELS.length - 1) {
              // End of cycle, remove this note
              const newNotes = notes.filter((n) => n !== note);
              newSteps[stepIndex] = { ...step, notes: newNotes, active: newNotes.length > 0, velocity: DEFAULT_VELOCITY };
            } else {
              // Next velocity
              newSteps[stepIndex] = { ...step, velocity: VELOCITY_LEVELS[idx + 1] };
            }
          }
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  setStepNote: (synthIndex, stepIndex, note) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = [...pattern.steps];
          const step = newSteps[stepIndex];
          const notes = step.notes || [];
          if (!notes.includes(note)) {
            newSteps[stepIndex] = { ...step, notes: [...notes, note].sort((a, b) => b - a), active: true };
          }
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  setStepVelocity: (synthIndex, stepIndex, velocity) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = [...pattern.steps];
          newSteps[stepIndex] = { ...newSteps[stepIndex], velocity: Math.max(0, Math.min(127, velocity)) };
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  clearPattern: (synthIndex) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const synthId = state.synths[synthIndex].id;
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          return createEmptySynthPattern(`${synthId}-${pi}`);
        });
      });
      return { patterns: newPatterns };
    }),

  pasteStepsIntoCurrentPattern: (synthIndex, steps) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          return { ...pattern, steps: steps.map((s) => ({ ...s, notes: s.notes ? [...s.notes] : [] })) };
        });
      });
      return { patterns: newPatterns };
    }),

  transposeCurrentPattern: (synthIndex, semitones) =>
    set((state) => {
      const patIdx = state.currentSynthPatternIndex[synthIndex];
      const newPatterns = state.patterns.map((synthPatterns, si) => {
        if (si !== synthIndex) return synthPatterns;
        return synthPatterns.map((pattern, pi) => {
          if (pi !== patIdx) return pattern;
          const newSteps = pattern.steps.map((step) => {
            if (!step.notes || step.notes.length === 0) return step;
            const transposed = step.notes
              .map((n) => n + semitones)
              .filter((n) => n >= 0 && n <= 127);
            return { ...step, notes: transposed, active: transposed.length > 0 };
          });
          return { ...pattern, steps: newSteps };
        });
      });
      return { patterns: newPatterns };
    }),

  getSynthPattern: (synthIndex) => {
    const state = get();
    const patIdx = state.currentSynthPatternIndex[synthIndex];
    return state.patterns[synthIndex][patIdx];
  },

  getCurrentSynthPattern: (synthIndex) => {
    const state = get();
    const patIdx = state.currentSynthPatternIndex[synthIndex];
    return state.patterns[synthIndex][patIdx];
  },
}));

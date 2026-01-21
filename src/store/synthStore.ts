import { create } from 'zustand';
import type { SynthSettings, SynthPattern, Step, OscillatorSettings, EnvelopeSettings, FilterSettings } from '../types';

const STEPS_PER_PATTERN = 16;

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
  // Patterns for each synth
  patterns: [SynthPattern, SynthPattern, SynthPattern];
  // Currently selected synth for editing
  selectedSynthIndex: number;
  // Whether synth section is expanded
  synthsEnabled: boolean;

  // Actions
  setSelectedSynth: (index: number) => void;
  setSynthsEnabled: (enabled: boolean) => void;

  // Synth settings
  updateSynthOscillator: (synthIndex: number, oscIndex: number, settings: Partial<OscillatorSettings>) => void;
  updateSynthEnvelope: (synthIndex: number, settings: Partial<EnvelopeSettings>) => void;
  updateSynthFilter: (synthIndex: number, settings: Partial<FilterSettings>) => void;
  updateSynthVolume: (synthIndex: number, volume: number) => void;
  updateSynthName: (synthIndex: number, name: string) => void;

  // Pattern editing
  toggleStep: (synthIndex: number, stepIndex: number) => void;
  toggleNote: (synthIndex: number, stepIndex: number, note: number) => void;
  setStepNote: (synthIndex: number, stepIndex: number, note: number) => void;
  setStepVelocity: (synthIndex: number, stepIndex: number, velocity: number) => void;
  clearPattern: (synthIndex: number) => void;

  // Getters
  getSynthPattern: (synthIndex: number) => SynthPattern;
}

export const useSynthStore = create<SynthStore>((set, get) => ({
  synths: [
    createDefaultSynthSettings('synth-1', 'Synth 1'),
    createDefaultSynthSettings('synth-2', 'Synth 2'),
    createDefaultSynthSettings('synth-3', 'Synth 3'),
  ],
  patterns: [
    createEmptySynthPattern('synth-1'),
    createEmptySynthPattern('synth-2'),
    createEmptySynthPattern('synth-3'),
  ],
  selectedSynthIndex: 0,
  synthsEnabled: true,

  setSelectedSynth: (index) => set({ selectedSynthIndex: index }),
  setSynthsEnabled: (enabled) => set({ synthsEnabled: enabled }),

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
      const newPatterns = [...state.patterns] as [SynthPattern, SynthPattern, SynthPattern];
      const pattern = { ...newPatterns[synthIndex] };
      const newSteps = [...pattern.steps];
      const step = newSteps[stepIndex];
      // Clear notes when toggling off
      if (step.active) {
        newSteps[stepIndex] = { ...step, active: false, notes: [] };
      } else {
        newSteps[stepIndex] = { ...step, active: true };
      }
      pattern.steps = newSteps;
      newPatterns[synthIndex] = pattern;
      return { patterns: newPatterns };
    }),

  toggleNote: (synthIndex, stepIndex, note) =>
    set((state) => {
      const newPatterns = [...state.patterns] as [SynthPattern, SynthPattern, SynthPattern];
      const pattern = { ...newPatterns[synthIndex] };
      const newSteps = [...pattern.steps];
      const step = newSteps[stepIndex];
      const notes = step.notes || [];
      const noteIndex = notes.indexOf(note);

      if (noteIndex >= 0) {
        // Remove the note
        const newNotes = notes.filter((n) => n !== note);
        newSteps[stepIndex] = {
          ...step,
          notes: newNotes,
          active: newNotes.length > 0,
        };
      } else {
        // Add the note
        const newNotes = [...notes, note].sort((a, b) => b - a);
        newSteps[stepIndex] = {
          ...step,
          notes: newNotes,
          active: true,
        };
      }
      pattern.steps = newSteps;
      newPatterns[synthIndex] = pattern;
      return { patterns: newPatterns };
    }),

  setStepNote: (synthIndex, stepIndex, note) =>
    set((state) => {
      const newPatterns = [...state.patterns] as [SynthPattern, SynthPattern, SynthPattern];
      const pattern = { ...newPatterns[synthIndex] };
      const newSteps = [...pattern.steps];
      const step = newSteps[stepIndex];
      const notes = step.notes || [];
      if (!notes.includes(note)) {
        newSteps[stepIndex] = {
          ...step,
          notes: [...notes, note].sort((a, b) => b - a),
          active: true,
        };
      }
      pattern.steps = newSteps;
      newPatterns[synthIndex] = pattern;
      return { patterns: newPatterns };
    }),

  setStepVelocity: (synthIndex, stepIndex, velocity) =>
    set((state) => {
      const newPatterns = [...state.patterns] as [SynthPattern, SynthPattern, SynthPattern];
      const pattern = { ...newPatterns[synthIndex] };
      const newSteps = [...pattern.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], velocity: Math.max(0, Math.min(127, velocity)) };
      pattern.steps = newSteps;
      newPatterns[synthIndex] = pattern;
      return { patterns: newPatterns };
    }),

  clearPattern: (synthIndex) =>
    set((state) => {
      const newPatterns = [...state.patterns] as [SynthPattern, SynthPattern, SynthPattern];
      newPatterns[synthIndex] = createEmptySynthPattern(state.synths[synthIndex].id);
      return { patterns: newPatterns };
    }),

  getSynthPattern: (synthIndex) => get().patterns[synthIndex],
}));

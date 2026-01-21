import { create } from 'zustand';
import type { Pattern, Step, TrackPattern } from '../types';
import { DRUM_SOUNDS, STEPS_PER_PATTERN, PATTERNS_COUNT } from '../data/drumKit';

// Create an empty step
const createEmptyStep = (): Step => ({
  active: false,
  velocity: 100,
});

// Create an empty track pattern for a drum sound
const createEmptyTrackPattern = (trackId: string): TrackPattern => ({
  trackId,
  steps: Array.from({ length: STEPS_PER_PATTERN }, () => createEmptyStep()),
});

// Create an empty pattern
const createEmptyPattern = (id: string, name: string): Pattern => ({
  id,
  name,
  tracks: DRUM_SOUNDS.map((sound) => createEmptyTrackPattern(sound.id)),
});

// Initialize all 16 patterns
const initializePatterns = (): Pattern[] => {
  return Array.from({ length: PATTERNS_COUNT }, (_, i) =>
    createEmptyPattern(`pattern-${i + 1}`, `Pattern ${i + 1}`)
  );
};

interface PatternStore {
  patterns: Pattern[];
  currentPatternId: string;

  // Getters
  getCurrentPattern: () => Pattern | undefined;

  // Actions
  setCurrentPattern: (patternId: string) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;
  setStepVelocity: (trackId: string, stepIndex: number, velocity: number) => void;
  clearPattern: (patternId: string) => void;
  copyPattern: (sourceId: string, targetId: string) => void;
  renamePattern: (patternId: string, name: string) => void;
}

export const usePatternStore = create<PatternStore>((set, get) => ({
  patterns: initializePatterns(),
  currentPatternId: 'pattern-1',

  getCurrentPattern: () => {
    const { patterns, currentPatternId } = get();
    return patterns.find((p) => p.id === currentPatternId);
  },

  setCurrentPattern: (patternId) => set({ currentPatternId: patternId }),

  toggleStep: (trackId, stepIndex) =>
    set((state) => ({
      patterns: state.patterns.map((pattern) => {
        if (pattern.id !== state.currentPatternId) return pattern;
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.trackId !== trackId) return track;
            return {
              ...track,
              steps: track.steps.map((step, i) => {
                if (i !== stepIndex) return step;
                return { ...step, active: !step.active };
              }),
            };
          }),
        };
      }),
    })),

  setStepVelocity: (trackId, stepIndex, velocity) =>
    set((state) => ({
      patterns: state.patterns.map((pattern) => {
        if (pattern.id !== state.currentPatternId) return pattern;
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.trackId !== trackId) return track;
            return {
              ...track,
              steps: track.steps.map((step, i) => {
                if (i !== stepIndex) return step;
                return { ...step, velocity: Math.max(0, Math.min(127, velocity)) };
              }),
            };
          }),
        };
      }),
    })),

  clearPattern: (patternId) =>
    set((state) => ({
      patterns: state.patterns.map((pattern) => {
        if (pattern.id !== patternId) return pattern;
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => ({
            ...track,
            steps: track.steps.map(() => createEmptyStep()),
          })),
        };
      }),
    })),

  copyPattern: (sourceId, targetId) =>
    set((state) => {
      const sourcePattern = state.patterns.find((p) => p.id === sourceId);
      if (!sourcePattern) return state;

      return {
        patterns: state.patterns.map((pattern) => {
          if (pattern.id !== targetId) return pattern;
          return {
            ...pattern,
            tracks: sourcePattern.tracks.map((track) => ({
              ...track,
              steps: track.steps.map((step) => ({ ...step })),
            })),
          };
        }),
      };
    }),

  renamePattern: (patternId, name) =>
    set((state) => ({
      patterns: state.patterns.map((pattern) => {
        if (pattern.id !== patternId) return pattern;
        return { ...pattern, name };
      }),
    })),
}));

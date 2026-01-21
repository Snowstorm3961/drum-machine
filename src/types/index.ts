export interface Step {
  active: boolean;
  velocity: number; // 0-127
  note?: number; // MIDI note number (for synth patterns) - legacy single note
  notes?: number[]; // MIDI note numbers (for polyphonic synth patterns)
}

export type OscillatorWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface OscillatorSettings {
  waveform: OscillatorWaveform;
  coarse: number; // semitones offset (-24 to +24)
  fine: number; // cents offset (-100 to +100)
  phase: number; // 0 to 360
  volume: number; // 0 to 1
  enabled: boolean;
}

export interface EnvelopeSettings {
  attack: number; // seconds (0 to 2)
  decay: number; // seconds (0 to 2)
  sustain: number; // 0 to 1
  release: number; // seconds (0 to 4)
}

export interface FilterSettings {
  type: BiquadFilterType;
  frequency: number; // Hz (20 to 20000)
  resonance: number; // Q (0.1 to 20)
  enabled: boolean;
}

export interface SynthSettings {
  id: string;
  name: string;
  oscillators: [OscillatorSettings, OscillatorSettings, OscillatorSettings];
  envelope: EnvelopeSettings;
  filter: FilterSettings;
  volume: number; // 0 to 1
}

export interface SynthPattern {
  id: string;
  synthId: string;
  steps: Step[]; // length: 16, each step has note info
}

export interface TrackPattern {
  trackId: string;
  steps: Step[];
}

export interface Pattern {
  id: string;
  name: string;
  tracks: TrackPattern[];
}

export interface Arrangement {
  id: string;
  name: string;
  sequence: string[]; // pattern IDs in order
}

export interface DrumSound {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  swing: number;
  masterVolume: number;
  patterns: Pattern[];
  arrangements: Arrangement[];
  currentPatternId: string;
  currentArrangementId: string | null;
}

// Audio engine types
export interface IAudioInstrument {
  id: string;
  name: string;
  trigger(time: number, velocity: number): void;
  setVolume(volume: number): void;
  connect(destination: AudioNode): void;
  disconnect(): void;
}

export type TransportState = 'stopped' | 'playing' | 'paused';

export interface TransportPosition {
  bar: number;
  beat: number;
  step: number;
  totalSteps: number;
}

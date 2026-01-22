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
  filterEnvelope: FilterEnvelopeSettings;
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

// Drum parameter types for each drum sound
export interface DrumParams {
  volume: number; // 0 to 1
}

export interface KickParams extends DrumParams {
  pitch: number; // Base frequency multiplier (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
  tone: number; // Click/punch amount (0 to 1)
}

export interface SnareParams extends DrumParams {
  pitch: number; // Body pitch (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
  snappy: number; // Noise amount (0 to 1)
}

export interface HiHatParams extends DrumParams {
  decay: number; // Decay time multiplier (0.5 to 3)
  tone: number; // Brightness/filter frequency (0 to 1)
}

export interface ClapParams extends DrumParams {
  decay: number; // Decay time multiplier (0.5 to 2)
  tone: number; // Brightness (0 to 1)
}

export interface TomParams extends DrumParams {
  pitch: number; // Pitch multiplier (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
}

export interface CowbellParams extends DrumParams {
  pitch: number; // Pitch multiplier (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
}

export interface CymbalParams extends DrumParams {
  decay: number; // Decay time multiplier (0.5 to 3)
  tone: number; // Brightness (0 to 1)
}

export interface RimParams extends DrumParams {
  pitch: number; // Pitch multiplier (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
}

export interface CongaParams extends DrumParams {
  pitch: number; // Pitch multiplier (0.5 to 2)
  decay: number; // Decay time multiplier (0.5 to 2)
}

export interface AllDrumParams {
  kick: KickParams;
  snare: SnareParams;
  closedHat: HiHatParams;
  openHat: HiHatParams;
  clap: ClapParams;
  tom: TomParams;
  cowbell: CowbellParams;
  cymbal: CymbalParams;
  rim: RimParams;
  conga: CongaParams;
}

// Filter envelope for synth
export interface FilterEnvelopeSettings {
  attack: number; // seconds (0 to 2)
  decay: number; // seconds (0 to 2)
  sustain: number; // 0 to 1 (multiplier of envelope amount)
  release: number; // seconds (0 to 4)
  amount: number; // -1 to 1 (how much envelope affects filter)
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

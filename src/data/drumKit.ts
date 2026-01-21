import type { DrumSound } from '../types';

export const DRUM_SOUNDS: DrumSound[] = [
  { id: 'kick', name: 'Kick', shortName: 'KK', color: '#e94560' },
  { id: 'snare', name: 'Snare', shortName: 'SN', color: '#ff9f43' },
  { id: 'clap', name: 'Clap', shortName: 'CP', color: '#54a0ff' },
  { id: 'closedHat', name: 'Closed Hat', shortName: 'CH', color: '#5f27cd' },
  { id: 'openHat', name: 'Open Hat', shortName: 'OH', color: '#00d2d3' },
  { id: 'tom', name: 'Tom', shortName: 'TM', color: '#ff6b6b' },
  { id: 'rim', name: 'Rim', shortName: 'RM', color: '#1dd1a1' },
  { id: 'cowbell', name: 'Cowbell', shortName: 'CB', color: '#feca57' },
  { id: 'cymbal', name: 'Cymbal', shortName: 'CY', color: '#48dbfb' },
  { id: 'conga', name: 'Conga', shortName: 'CG', color: '#ff9ff3' },
];

export const STEPS_PER_PATTERN = 16;
export const PATTERNS_COUNT = 16;
export const DEFAULT_BPM = 120;
export const MIN_BPM = 40;
export const MAX_BPM = 300;

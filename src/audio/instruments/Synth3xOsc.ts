import type { IAudioInstrument, SynthSettings, OscillatorSettings, EnvelopeSettings, FilterSettings } from '../../types';
import { SynthVoice } from '../synthesis/SynthVoice';

const createDefaultOscSettings = (): OscillatorSettings => ({
  waveform: 'sawtooth',
  coarse: 0,
  fine: 0,
  phase: 0,
  volume: 0.5,
  enabled: true,
});

const DEFAULT_ENVELOPE: EnvelopeSettings = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
};

const DEFAULT_FILTER: FilterSettings = {
  type: 'lowpass',
  frequency: 2000,
  resonance: 1,
  enabled: true,
};

export class Synth3xOsc implements IAudioInstrument {
  id: string;
  name: string;

  private voices: SynthVoice[] = [];
  private output: GainNode;
  private voiceIndex: number = 0;
  private maxVoices: number = 4;

  // Current settings
  private oscSettings: [OscillatorSettings, OscillatorSettings, OscillatorSettings];
  private envelope: EnvelopeSettings;
  private filter: FilterSettings;

  constructor(audioContext: AudioContext, id: string, name: string) {
    this.id = id;
    this.name = name;

    // Initialize default settings
    this.oscSettings = [
      { ...createDefaultOscSettings(), waveform: 'sawtooth', volume: 0.4 },
      { ...createDefaultOscSettings(), waveform: 'square', coarse: 0, volume: 0.3, enabled: true },
      { ...createDefaultOscSettings(), waveform: 'sine', coarse: -12, volume: 0.3, enabled: false },
    ];
    this.envelope = { ...DEFAULT_ENVELOPE };
    this.filter = { ...DEFAULT_FILTER };

    // Create output gain
    this.output = audioContext.createGain();
    this.output.gain.value = 0.5;

    // Create voice pool
    for (let i = 0; i < this.maxVoices; i++) {
      const voice = new SynthVoice(audioContext);
      voice.connect(this.output);
      this.voices.push(voice);
    }
  }

  private getNextVoice(note: number): SynthVoice {
    // First, check if this note is already playing - reuse that voice
    for (const voice of this.voices) {
      if (voice.getCurrentNote() === note) {
        return voice;
      }
    }

    // Find a free voice
    for (const voice of this.voices) {
      if (!voice.getIsPlaying()) {
        return voice;
      }
    }

    // No free voice, use round-robin
    const voice = this.voices[this.voiceIndex];
    this.voiceIndex = (this.voiceIndex + 1) % this.maxVoices;
    return voice;
  }

  trigger(time: number, velocity: number): void {
    // Default trigger plays middle C
    this.noteOn(60, velocity, time);
  }

  noteOn(note: number, velocity: number, time: number): void {
    const voice = this.getNextVoice(note);
    voice.noteOn(note, velocity, time, this.oscSettings, this.envelope, this.filter);
  }

  noteOff(note: number, time: number): void {
    // Find the voice playing this note
    for (const voice of this.voices) {
      if (voice.getCurrentNote() === note && voice.getIsPlaying()) {
        voice.noteOff(time, this.envelope);
        break;
      }
    }
  }

  allNotesOff(time: number): void {
    for (const voice of this.voices) {
      if (voice.getIsPlaying()) {
        voice.noteOff(time, this.envelope);
      }
    }
  }

  // Settings setters
  setOscillator(index: number, settings: Partial<OscillatorSettings>): void {
    if (index >= 0 && index < 3) {
      this.oscSettings[index] = { ...this.oscSettings[index], ...settings };
    }
  }

  setEnvelope(settings: Partial<EnvelopeSettings>): void {
    this.envelope = { ...this.envelope, ...settings };
  }

  setFilter(settings: Partial<FilterSettings>): void {
    this.filter = { ...this.filter, ...settings };
  }

  setVolume(volume: number): void {
    this.output.gain.value = Math.max(0, Math.min(1, volume));
  }

  // Settings getters
  getSettings(): SynthSettings {
    return {
      id: this.id,
      name: this.name,
      oscillators: this.oscSettings,
      envelope: this.envelope,
      filter: this.filter,
      volume: this.output.gain.value,
    };
  }

  applySettings(settings: Partial<SynthSettings>): void {
    if (settings.oscillators) {
      this.oscSettings = settings.oscillators;
    }
    if (settings.envelope) {
      this.envelope = settings.envelope;
    }
    if (settings.filter) {
      this.filter = settings.filter;
    }
    if (settings.volume !== undefined) {
      this.setVolume(settings.volume);
    }
    if (settings.name) {
      this.name = settings.name;
    }
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }
}

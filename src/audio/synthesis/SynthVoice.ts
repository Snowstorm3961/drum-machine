import type { OscillatorSettings, EnvelopeSettings, FilterSettings } from '../../types';

export class SynthVoice {
  private audioContext: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private oscillatorGains: GainNode[] = [];
  private envelope: GainNode;
  private filter: BiquadFilterNode;
  private output: GainNode;
  private isPlaying: boolean = false;
  private releaseTimeout: number | null = null;
  private currentNote: number = -1;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create envelope gain
    this.envelope = audioContext.createGain();
    this.envelope.gain.value = 0;

    // Create filter
    this.filter = audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    // Create output gain
    this.output = audioContext.createGain();
    this.output.gain.value = 1;

    // Connect envelope -> filter -> output
    this.envelope.connect(this.filter);
    this.filter.connect(this.output);
  }

  private midiToFrequency(midiNote: number, coarse: number = 0, fine: number = 0): number {
    const adjustedNote = midiNote + coarse + fine / 100;
    return 440 * Math.pow(2, (adjustedNote - 69) / 12);
  }

  noteOn(
    note: number,
    velocity: number,
    time: number,
    oscSettings: OscillatorSettings[],
    envSettings: EnvelopeSettings,
    filterSettings: FilterSettings
  ): void {
    // Cancel any pending release
    if (this.releaseTimeout !== null) {
      clearTimeout(this.releaseTimeout);
      this.releaseTimeout = null;
    }

    // Stop existing oscillators
    this.stopOscillators();

    this.currentNote = note;
    this.isPlaying = true;

    const vel = velocity / 127;

    // Update filter
    if (filterSettings.enabled) {
      this.filter.type = filterSettings.type;
      this.filter.frequency.setValueAtTime(filterSettings.frequency, time);
      this.filter.Q.setValueAtTime(filterSettings.resonance, time);
    } else {
      this.filter.type = 'allpass';
    }

    // Create oscillators for each enabled osc setting
    oscSettings.forEach((settings) => {
      if (!settings.enabled) return;

      const osc = this.audioContext.createOscillator();
      osc.type = settings.waveform;
      osc.frequency.setValueAtTime(
        this.midiToFrequency(note, settings.coarse, settings.fine),
        time
      );

      // Apply phase offset by starting slightly later
      const phaseOffset = (settings.phase / 360) * (1 / this.midiToFrequency(note, settings.coarse, settings.fine));

      const oscGain = this.audioContext.createGain();
      oscGain.gain.setValueAtTime(settings.volume, time);

      osc.connect(oscGain);
      oscGain.connect(this.envelope);

      osc.start(time + phaseOffset);

      this.oscillators.push(osc);
      this.oscillatorGains.push(oscGain);
    });

    // Apply ADSR envelope
    const now = time;
    this.envelope.gain.cancelScheduledValues(now);
    this.envelope.gain.setValueAtTime(0, now);
    this.envelope.gain.linearRampToValueAtTime(vel, now + envSettings.attack);
    this.envelope.gain.linearRampToValueAtTime(
      vel * envSettings.sustain,
      now + envSettings.attack + envSettings.decay
    );
  }

  noteOff(time: number, envSettings: EnvelopeSettings): void {
    if (!this.isPlaying) return;

    const now = time;
    const currentGain = this.envelope.gain.value;

    this.envelope.gain.cancelScheduledValues(now);
    this.envelope.gain.setValueAtTime(currentGain, now);
    this.envelope.gain.linearRampToValueAtTime(0, now + envSettings.release);

    // Schedule oscillator stop after release
    const releaseMs = envSettings.release * 1000 + 50;
    this.releaseTimeout = window.setTimeout(() => {
      this.stopOscillators();
      this.isPlaying = false;
      this.currentNote = -1;
      this.releaseTimeout = null;
    }, releaseMs);
  }

  private stopOscillators(): void {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });
    this.oscillatorGains.forEach((gain) => {
      gain.disconnect();
    });
    this.oscillators = [];
    this.oscillatorGains = [];
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentNote(): number {
    return this.currentNote;
  }

  setVolume(volume: number): void {
    this.output.gain.value = volume;
  }
}

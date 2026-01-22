import type { OscillatorSettings, EnvelopeSettings, FilterSettings, FilterEnvelopeSettings } from '../../types';

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
    filterSettings: FilterSettings,
    filterEnvSettings?: FilterEnvelopeSettings
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
    const now = time;

    // Update filter
    if (filterSettings.enabled) {
      this.filter.type = filterSettings.type;
      this.filter.Q.setValueAtTime(filterSettings.resonance, now);

      // Apply filter envelope if provided
      if (filterEnvSettings && Math.abs(filterEnvSettings.amount) > 0.01) {
        const baseFreq = filterSettings.frequency;
        // Calculate envelope range - amount determines how much the envelope modulates
        // Positive amount: envelope opens filter (low to high)
        // Negative amount: envelope closes filter (high to low)
        const envRange = filterEnvSettings.amount * 10000; // Scale amount to frequency range
        const startFreq = Math.max(20, Math.min(20000, baseFreq - envRange * (filterEnvSettings.amount > 0 ? 1 : 0)));
        const peakFreq = Math.max(20, Math.min(20000, baseFreq + envRange * (filterEnvSettings.amount > 0 ? 1 : 0)));
        const sustainFreq = startFreq + (peakFreq - startFreq) * filterEnvSettings.sustain;

        this.filter.frequency.cancelScheduledValues(now);
        this.filter.frequency.setValueAtTime(startFreq, now);
        this.filter.frequency.linearRampToValueAtTime(peakFreq, now + filterEnvSettings.attack);
        this.filter.frequency.linearRampToValueAtTime(sustainFreq, now + filterEnvSettings.attack + filterEnvSettings.decay);
      } else {
        this.filter.frequency.cancelScheduledValues(now);
        this.filter.frequency.setValueAtTime(filterSettings.frequency, now);
      }
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
        now
      );

      // Apply phase offset by starting slightly later
      const phaseOffset = (settings.phase / 360) * (1 / this.midiToFrequency(note, settings.coarse, settings.fine));

      const oscGain = this.audioContext.createGain();
      oscGain.gain.setValueAtTime(settings.volume, now);

      osc.connect(oscGain);
      oscGain.connect(this.envelope);

      osc.start(now + phaseOffset);

      this.oscillators.push(osc);
      this.oscillatorGains.push(oscGain);
    });

    // Apply ADSR envelope
    this.envelope.gain.cancelScheduledValues(now);
    this.envelope.gain.setValueAtTime(0, now);
    this.envelope.gain.linearRampToValueAtTime(vel, now + envSettings.attack);
    this.envelope.gain.linearRampToValueAtTime(
      vel * envSettings.sustain,
      now + envSettings.attack + envSettings.decay
    );
  }

  noteOff(time: number, envSettings: EnvelopeSettings, filterEnvSettings?: FilterEnvelopeSettings): void {
    if (!this.isPlaying) return;

    const now = time;
    const currentGain = this.envelope.gain.value;

    this.envelope.gain.cancelScheduledValues(now);
    this.envelope.gain.setValueAtTime(currentGain, now);
    this.envelope.gain.linearRampToValueAtTime(0, now + envSettings.release);

    // Apply filter envelope release if provided
    if (filterEnvSettings && Math.abs(filterEnvSettings.amount) > 0.01) {
      const currentFilterFreq = this.filter.frequency.value;
      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setValueAtTime(currentFilterFreq, now);
      // Return to base frequency during release
      const baseFreq = filterEnvSettings.amount > 0 ? 20 : 20000;
      this.filter.frequency.linearRampToValueAtTime(
        Math.max(20, Math.min(20000, baseFreq)),
        now + filterEnvSettings.release
      );
    }

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

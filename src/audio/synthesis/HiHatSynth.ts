import type { HiHatParams } from '../../types';

export class HiHatSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private isOpen: boolean;
  private params: HiHatParams = {
    volume: 1,
    decay: 1,
    tone: 0.5,
  };

  constructor(audioContext: AudioContext, isOpen: boolean = false) {
    this.audioContext = audioContext;
    this.isOpen = isOpen;
    this.output = audioContext.createGain();
    this.output.gain.value = this.params.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const { decay, tone } = this.params;
    const vel = velocity / 127;
    const baseDecay = this.isOpen ? 0.3 : 0.05;
    const decayTime = baseDecay * decay;

    // Calculate filter frequencies based on tone (0 = darker, 1 = brighter)
    const highpassFreq = 4000 + tone * 6000;
    const bandpassFreq = 6000 + tone * 8000;

    // Primary: filtered white noise
    const noiseBuffer = this.createNoiseBuffer(decayTime + 0.1);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // High-pass filter to remove low frequencies
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = highpassFreq;
    highpass.Q.value = 0.5;

    // Band-pass for character
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = bandpassFreq;
    bandpass.Q.value = 1;

    // Main envelope
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.6, time);
    if (this.isOpen) {
      noiseGain.gain.exponentialRampToValueAtTime(vel * 0.3, time + 0.05 * decay);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
    } else {
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
    }

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + decayTime + 0.1);

    // Secondary: very subtle high-frequency tone for metallic edge
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 10000 + tone * 4000;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(vel * 0.03 * (0.5 + tone * 0.5), time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.5);

    const oscFilter = this.audioContext.createBiquadFilter();
    oscFilter.type = 'highpass';
    oscFilter.frequency.value = 8000 + tone * 4000;

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.output);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const bufferSize = Math.ceil(this.audioContext.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  setParams(params: Partial<HiHatParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): HiHatParams {
    return { ...this.params };
  }

  setVolume(volume: number): void {
    this.params.volume = volume;
    this.output.gain.value = volume;
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }
}

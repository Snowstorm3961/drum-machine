import type { ClapParams } from '../../types';

export class ClapSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: ClapParams = {
    volume: 1,
    decay: 1,
    tone: 0.5,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.params.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const { decay, tone } = this.params;
    const vel = velocity / 127;
    const finalDecay = 0.2 * decay;

    // Multiple noise bursts to simulate multiple hands clapping
    const delays = [0, 0.01, 0.02, 0.03];

    delays.forEach((delay) => {
      this.createNoiseBurst(time + delay, vel * 0.5, 0.02, tone);
    });

    // Final longer decay
    this.createNoiseBurst(time + 0.03, vel, finalDecay, tone);
  }

  private createNoiseBurst(time: number, amplitude: number, duration: number, tone: number): void {
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Tone affects filter frequencies (higher = brighter)
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 800 + tone * 1000;
    bandpass.Q.value = 1;

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 400 + tone * 600;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(amplitude, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + duration + 0.01);
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

  setParams(params: Partial<ClapParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): ClapParams {
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

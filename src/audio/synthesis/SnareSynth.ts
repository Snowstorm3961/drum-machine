import type { SnareParams } from '../../types';

export class SnareSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: SnareParams = {
    volume: 1,
    pitch: 1,
    decay: 1,
    snappy: 0.5,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.params.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const { pitch, decay, snappy } = this.params;
    const vel = velocity / 127;
    const noiseDecay = 0.2 * decay;
    const bodyDecay = 0.1 * decay;

    // Noise component (snare rattle)
    const noiseBuffer = this.createNoiseBuffer(noiseDecay + 0.05);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000 + (1 - snappy) * 2000;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.4 * snappy, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.output);

    // Body component (triangle wave)
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(80 * pitch, time + 0.05 * decay);

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(vel * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay);

    osc.connect(oscGain);
    oscGain.connect(this.output);

    noise.start(time);
    noise.stop(time + noiseDecay + 0.05);
    osc.start(time);
    osc.stop(time + bodyDecay + 0.01);
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

  setParams(params: Partial<SnareParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): SnareParams {
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

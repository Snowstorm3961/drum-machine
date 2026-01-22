import type { RimParams } from '../../types';

export class RimSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: RimParams = {
    volume: 1,
    pitch: 1,
    decay: 1,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.params.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const { pitch, decay } = this.params;
    const vel = velocity / 127;
    const clickDecay = 0.02 * decay;
    const noiseDecay = 0.01 * decay;

    // High-pitched click
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1700 * pitch, time);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(vel * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 300;

    osc.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + clickDecay + 0.01);

    // Add a short noise burst
    const noiseBuffer = this.createNoiseBuffer(noiseDecay);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.15, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

    const noiseHighpass = this.audioContext.createBiquadFilter();
    noiseHighpass.type = 'highpass';
    noiseHighpass.frequency.value = 2000;

    noise.connect(noiseHighpass);
    noiseHighpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + noiseDecay + 0.01);
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

  setParams(params: Partial<RimParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): RimParams {
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

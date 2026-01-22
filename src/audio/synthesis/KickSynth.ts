import type { KickParams } from '../../types';

export class KickSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: KickParams = {
    volume: 1,
    pitch: 1,
    decay: 1,
    tone: 0.5,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.params.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const { pitch, decay, tone } = this.params;
    const vel = velocity / 127;

    // Main body oscillator
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';

    // Frequency envelope: starts high, drops to low (affected by pitch)
    const startFreq = 150 * pitch;
    const midFreq = 40 * pitch;
    const endFreq = 30 * pitch;
    const decayTime = 0.5 * decay;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(midFreq, time + 0.05 * decay);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.15 * decay);

    // Amplitude envelope
    gain.gain.setValueAtTime(vel * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    // Click/punch layer (affected by tone)
    if (tone > 0.1) {
      const clickOsc = this.audioContext.createOscillator();
      const clickGain = this.audioContext.createGain();

      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(startFreq * 4, time);
      clickOsc.frequency.exponentialRampToValueAtTime(startFreq * 2, time + 0.01);

      clickGain.gain.setValueAtTime(vel * tone * 0.4, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      clickOsc.connect(clickGain);
      clickGain.connect(this.output);

      clickOsc.start(time);
      clickOsc.stop(time + 0.05);
    }
  }

  setParams(params: Partial<KickParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): KickParams {
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

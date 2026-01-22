import type { TomParams } from '../../types';

export class TomSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: TomParams = {
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
    const decayTime = 0.3 * decay;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';

    // Pitch envelope for tom
    osc.frequency.setValueAtTime(200 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(80 * pitch, time + 0.1 * decay);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);
  }

  setParams(params: Partial<TomParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): TomParams {
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

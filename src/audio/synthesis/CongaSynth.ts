import type { CongaParams } from '../../types';

export class CongaSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: CongaParams = {
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
    const decayTime = 0.25 * decay;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';

    // Conga pitch envelope - starts high, drops quickly
    osc.frequency.setValueAtTime(350 * pitch, time);
    osc.frequency.exponentialRampToValueAtTime(200 * pitch, time + 0.05 * decay);
    osc.frequency.exponentialRampToValueAtTime(150 * pitch, time + 0.2 * decay);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(vel * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    // Add a slight attack click
    const clickOsc = this.audioContext.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.value = 800 * pitch;

    const clickGain = this.audioContext.createGain();
    clickGain.gain.setValueAtTime(vel * 0.2, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

    clickOsc.connect(clickGain);
    clickGain.connect(this.output);

    clickOsc.start(time);
    clickOsc.stop(time + 0.02);
  }

  setParams(params: Partial<CongaParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): CongaParams {
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

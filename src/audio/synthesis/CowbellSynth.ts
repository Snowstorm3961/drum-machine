import type { CowbellParams } from '../../types';

export class CowbellSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private params: CowbellParams = {
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
    const decayTime = 0.4 * decay;

    // Two detuned square waves for metallic sound
    const freq1 = 560 * pitch;
    const freq2 = 845 * pitch;

    [freq1, freq2].forEach((freq) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(vel * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      const bandpass = this.audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = (freq1 + freq2) / 2;
      bandpass.Q.value = 3;

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.output);

      osc.start(time);
      osc.stop(time + decayTime + 0.01);
    });
  }

  setParams(params: Partial<CowbellParams>): void {
    this.params = { ...this.params, ...params };
    if (params.volume !== undefined) {
      this.output.gain.value = params.volume;
    }
  }

  getParams(): CowbellParams {
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

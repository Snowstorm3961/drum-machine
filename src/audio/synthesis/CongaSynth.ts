export class CongaSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private volume: number = 1;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const vel = velocity / 127;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';

    // Conga pitch envelope - starts high, drops quickly
    osc.frequency.setValueAtTime(350, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(150, time + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(vel * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + 0.25);

    // Add a slight attack click
    const clickOsc = this.audioContext.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.value = 800;

    const clickGain = this.audioContext.createGain();
    clickGain.gain.setValueAtTime(vel * 0.2, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

    clickOsc.connect(clickGain);
    clickGain.connect(this.output);

    clickOsc.start(time);
    clickOsc.stop(time + 0.01);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.output.gain.value = volume;
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }
}

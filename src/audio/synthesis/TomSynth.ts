export class TomSynth {
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

    // Pitch envelope for tom
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + 0.3);
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

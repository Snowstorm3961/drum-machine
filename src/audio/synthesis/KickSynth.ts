export class KickSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private volume: number = 1;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = this.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    // 808 kick: sine wave with pitch envelope
    osc.type = 'sine';

    // Frequency envelope: starts high, drops to low
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

    // Amplitude envelope
    const vel = velocity / 127;
    gain.gain.setValueAtTime(vel * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + 0.5);
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

export class CowbellSynth {
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

    // Two detuned square waves for metallic sound
    const freq1 = 560;
    const freq2 = 845;

    [freq1, freq2].forEach((freq) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(vel * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      const bandpass = this.audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = (freq1 + freq2) / 2;
      bandpass.Q.value = 3;

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.output);

      osc.start(time);
      osc.stop(time + 0.4);
    });
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

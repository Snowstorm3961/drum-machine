export class ClapSynth {
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

    // Multiple noise bursts to simulate multiple hands clapping
    const delays = [0, 0.01, 0.02, 0.03];

    delays.forEach((delay) => {
      this.createNoiseBurst(time + delay, vel * 0.5, 0.02);
    });

    // Final longer decay
    this.createNoiseBurst(time + 0.03, vel, 0.2);
  }

  private createNoiseBurst(time: number, amplitude: number, duration: number): void {
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 1;

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 600;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(amplitude, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + duration);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
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

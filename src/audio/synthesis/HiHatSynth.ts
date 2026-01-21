export class HiHatSynth {
  private audioContext: AudioContext;
  private output: GainNode;
  private volume: number = 1;
  private isOpen: boolean;

  constructor(audioContext: AudioContext, isOpen: boolean = false) {
    this.audioContext = audioContext;
    this.isOpen = isOpen;
    this.output = audioContext.createGain();
    this.output.gain.value = this.volume;
  }

  trigger(time: number, velocity: number = 1): void {
    const vel = velocity / 127;
    const decayTime = this.isOpen ? 0.3 : 0.05;

    // Primary: filtered white noise
    const noiseBuffer = this.createNoiseBuffer(decayTime + 0.1);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // High-pass filter to remove low frequencies
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = this.isOpen ? 6000 : 8000;
    highpass.Q.value = 0.5;

    // Band-pass for character
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = this.isOpen ? 8000 : 10000;
    bandpass.Q.value = 1;

    // Main envelope
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.6, time);
    if (this.isOpen) {
      // Open hat: slower decay
      noiseGain.gain.exponentialRampToValueAtTime(vel * 0.3, time + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
    } else {
      // Closed hat: fast decay
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
    }

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + decayTime + 0.1);

    // Secondary: very subtle high-frequency tone for slight metallic edge
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 12000;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(vel * 0.03, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.5);

    const oscFilter = this.audioContext.createBiquadFilter();
    oscFilter.type = 'highpass';
    oscFilter.frequency.value = 10000;

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.output);

    osc.start(time);
    osc.stop(time + decayTime);
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

export class CymbalSynth {
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
    const decayTime = 1.2;

    // Primary: filtered white noise with long decay (the "wash")
    const noiseBuffer = this.createNoiseBuffer(decayTime + 0.2);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // High-pass to remove mud
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 4000;
    highpass.Q.value = 0.3;

    // Gentle band-pass for shimmer character
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 7000;
    bandpass.Q.value = 0.5;

    // Noise envelope - fast attack, long decay
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.5, time);
    noiseGain.gain.setValueAtTime(vel * 0.4, time + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(vel * 0.15, time + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + decayTime + 0.2);

    // Secondary: subtle high-frequency sizzle layer
    const sizzleBuffer = this.createNoiseBuffer(decayTime);
    const sizzle = this.audioContext.createBufferSource();
    sizzle.buffer = sizzleBuffer;

    const sizzleFilter = this.audioContext.createBiquadFilter();
    sizzleFilter.type = 'highpass';
    sizzleFilter.frequency.value = 10000;

    const sizzleGain = this.audioContext.createGain();
    sizzleGain.gain.setValueAtTime(vel * 0.25, time);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.8);

    sizzle.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(this.output);

    sizzle.start(time);
    sizzle.stop(time + decayTime);

    // Tiny bit of metallic ping on attack only
    const ping = this.audioContext.createOscillator();
    ping.type = 'sine';
    ping.frequency.value = 6000;

    const pingGain = this.audioContext.createGain();
    pingGain.gain.setValueAtTime(vel * 0.08, time);
    pingGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    ping.connect(pingGain);
    pingGain.connect(this.output);

    ping.start(time);
    ping.stop(time + 0.05);
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

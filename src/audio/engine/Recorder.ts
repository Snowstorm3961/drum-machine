export class Recorder {
  private audioContext: AudioContext;
  private sourceNode: AudioNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  connect(sourceNode: AudioNode): void {
    this.sourceNode = sourceNode;
  }

  startRecording(): void {
    if (this.isRecording || !this.sourceNode) return;

    this.recordedChunks = [];

    // Create a MediaStreamDestination to capture audio
    this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

    // Connect source to the media stream destination (parallel to main output)
    this.sourceNode.connect(this.mediaStreamDestination);

    // Create MediaRecorder with the stream
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.mediaStreamDestination.stream, {
      mimeType,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.isRecording = true;
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        this.isRecording = false;

        // Disconnect the media stream destination
        if (this.mediaStreamDestination && this.sourceNode) {
          try {
            this.sourceNode.disconnect(this.mediaStreamDestination);
          } catch {
            // Ignore disconnect errors
          }
          this.mediaStreamDestination = null;
        }

        if (this.recordedChunks.length === 0) {
          resolve(null);
          return;
        }

        // Combine chunks into a single blob
        const webmBlob = new Blob(this.recordedChunks, { type: this.mediaRecorder!.mimeType });
        this.recordedChunks = [];
        this.mediaRecorder = null;

        // Convert WebM to WAV for better compatibility
        try {
          const wavBlob = await this.convertToWav(webmBlob);
          resolve(wavBlob);
        } catch {
          // If conversion fails, return the webm blob
          resolve(webmBlob);
        }
      };

      this.mediaRecorder!.stop();
    });
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    // Decode the webm audio
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Convert to WAV
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Get audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    // Interleave channels
    const interleaved = new Float32Array(length * numChannels);
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        interleaved[i * numChannels + ch] = channels[ch][i];
      }
    }

    return this.float32ToWav(interleaved, sampleRate, numChannels);
  }

  private float32ToWav(samples: Float32Array, sampleRate: number, numChannels: number): Blob {
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = samples.length / numChannels;

    const buffer = new ArrayBuffer(44 + numSamples * numChannels * bytesPerSample);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * numChannels * bytesPerSample, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * numChannels * bytesPerSample, true);

    // Write samples (convert float32 to int16)
    let writeOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(writeOffset, int16, true);
      writeOffset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

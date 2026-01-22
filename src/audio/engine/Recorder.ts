export class Recorder {
  private audioContext: AudioContext;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private mimeType: string;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    // Create the MediaStreamDestination immediately - it stays connected permanently
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();
    // Determine supported mime type once
    this.mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
  }

  // Returns the destination node that should be connected to the audio source
  getDestination(): MediaStreamAudioDestinationNode {
    return this.mediaStreamDestination;
  }

  startRecording(): void {
    if (this.isRecording) return;

    this.recordedChunks = [];

    // Create a fresh MediaRecorder each time
    this.mediaRecorder = new MediaRecorder(this.mediaStreamDestination.stream, {
      mimeType: this.mimeType,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.isRecording = true;
    console.log('Recording started');
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      const currentMimeType = this.mimeType;

      this.mediaRecorder!.onstop = async () => {
        this.isRecording = false;
        console.log('Recording stopped, chunks:', this.recordedChunks.length);

        if (this.recordedChunks.length === 0) {
          resolve(null);
          return;
        }

        // Combine chunks into a single blob
        const webmBlob = new Blob(this.recordedChunks, { type: currentMimeType });
        this.recordedChunks = [];
        this.mediaRecorder = null;

        console.log('WebM blob size:', webmBlob.size);

        // Convert WebM to WAV for better compatibility
        try {
          const wavBlob = await this.convertToWav(webmBlob);
          console.log('WAV blob size:', wavBlob.size);
          resolve(wavBlob);
        } catch (e) {
          console.log('WAV conversion failed, returning WebM:', e);
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

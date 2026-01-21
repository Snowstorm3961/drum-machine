import { Scheduler } from './Scheduler';
import { Recorder } from './Recorder';
import { DrumKit } from '../instruments/DrumKit';
import { Synth3xOsc } from '../instruments/Synth3xOsc';
import type { Step, SynthSettings, SynthPattern } from '../../types';

type StepCallback = (step: number) => void;
type RecordingCallback = (isRecording: boolean) => void;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioContext: AudioContext | null = null;
  private scheduler: Scheduler | null = null;
  private recorder: Recorder | null = null;
  private drumKit: DrumKit | null = null;
  private synths: Synth3xOsc[] = [];
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private stepCallback: StepCallback | null = null;
  private recordingCallback: RecordingCallback | null = null;

  // Pattern data - will be set from store
  private currentDrumPattern: Map<string, Step[]> = new Map();
  private currentSynthPatterns: SynthPattern[] = [];
  private synthsEnabled: boolean = true;

  // Track active notes for proper note-off handling
  private activeNotes: Map<string, { note: number; step: number }[]> = new Map();

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create audio context
    this.audioContext = new AudioContext();

    // Resume context if suspended (required for iOS/Chrome autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);

    // Create scheduler
    this.scheduler = new Scheduler(this.audioContext);
    this.scheduler.setCallback((time, step) => {
      this.onStep(time, step);
    });

    // Create drum kit
    this.drumKit = new DrumKit(this.audioContext);
    this.drumKit.connect(this.masterGain);

    // Create 3 synths
    for (let i = 0; i < 3; i++) {
      const synth = new Synth3xOsc(this.audioContext, `synth-${i + 1}`, `Synth ${i + 1}`);
      synth.connect(this.masterGain);
      this.synths.push(synth);
      this.activeNotes.set(`synth-${i + 1}`, []);
    }

    // Create recorder
    this.recorder = new Recorder(this.audioContext);
    this.recorder.connect(this.masterGain);

    this.isInitialized = true;
  }

  async ensureResumed(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private onStep(time: number, step: number): void {
    // Trigger drums for this step based on pattern
    this.currentDrumPattern.forEach((steps, drumId) => {
      const stepData = steps[step];
      if (stepData && stepData.active) {
        this.drumKit?.triggerDrum(drumId, time, stepData.velocity);
      }
    });

    // Trigger synths for this step
    if (this.synthsEnabled) {
      this.currentSynthPatterns.forEach((pattern, synthIndex) => {
        const synth = this.synths[synthIndex];
        if (!synth || !pattern) return;

        const stepData = pattern.steps[step];
        const synthId = synth.id;
        const activeNotesForSynth = this.activeNotes.get(synthId) || [];

        // Get notes for this step (support both legacy single note and new notes array)
        const stepNotes: number[] = stepData.notes && stepData.notes.length > 0
          ? stepData.notes
          : (stepData.note !== undefined ? [stepData.note] : []);

        // Note off for any notes that should end on this step
        const notesToRelease = activeNotesForSynth.filter((n) => {
          const nextStep = (n.step + 1) % 16;
          const nextStepData = pattern.steps[nextStep];
          const nextStepNotes: number[] = nextStepData.notes && nextStepData.notes.length > 0
            ? nextStepData.notes
            : (nextStepData.note !== undefined ? [nextStepData.note] : []);
          // Release if we've moved past, or next step doesn't have this note
          return step === nextStep && !nextStepNotes.includes(n.note);
        });

        notesToRelease.forEach((n) => {
          synth.noteOff(n.note, time);
        });

        // Update active notes - remove released ones
        const remainingNotes = activeNotesForSynth.filter(
          (n) => !notesToRelease.some((r) => r.note === n.note && r.step === n.step)
        );

        // Trigger new notes if step is active
        if (stepData && stepData.active && stepNotes.length > 0) {
          stepNotes.forEach((note) => {
            // Check if this exact note is already playing
            const isAlreadyPlaying = remainingNotes.some((n) => n.note === note);

            if (!isAlreadyPlaying) {
              synth.noteOn(note, stepData.velocity, time);
              remainingNotes.push({ note, step });
            }
          });
        }

        this.activeNotes.set(synthId, remainingNotes);
      });
    }

    // Notify UI of current step
    if (this.stepCallback) {
      this.stepCallback(step);
    }
  }

  setStepCallback(callback: StepCallback | null): void {
    this.stepCallback = callback;
  }

  setRecordingCallback(callback: RecordingCallback | null): void {
    this.recordingCallback = callback;
  }

  setDrumPattern(pattern: Map<string, Step[]>): void {
    this.currentDrumPattern = pattern;
  }

  // Legacy alias
  setPattern(pattern: Map<string, Step[]>): void {
    this.setDrumPattern(pattern);
  }

  setSynthPatterns(patterns: SynthPattern[]): void {
    this.currentSynthPatterns = patterns;
  }

  setSynthsEnabled(enabled: boolean): void {
    this.synthsEnabled = enabled;
    if (!enabled) {
      // Release all synth notes
      this.synths.forEach((synth) => {
        synth.allNotesOff(this.audioContext?.currentTime || 0);
      });
      this.activeNotes.forEach((_, key) => {
        this.activeNotes.set(key, []);
      });
    }
  }

  updateSynthSettings(synthIndex: number, settings: Partial<SynthSettings>): void {
    const synth = this.synths[synthIndex];
    if (synth) {
      synth.applySettings(settings);
    }
  }

  getSynth(index: number): Synth3xOsc | null {
    return this.synths[index] || null;
  }

  setBpm(bpm: number): void {
    this.scheduler?.setBpm(bpm);
  }

  getBpm(): number {
    return this.scheduler?.getBpm() ?? 120;
  }

  setSwing(swing: number): void {
    this.scheduler?.setSwing(swing);
  }

  getSwing(): number {
    return this.scheduler?.getSwing() ?? 0;
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  play(): void {
    if (!this.isInitialized) {
      console.warn('AudioEngine not initialized');
      return;
    }
    this.scheduler?.start();
  }

  stop(): void {
    this.scheduler?.stop();
    // Release all synth notes
    const now = this.audioContext?.currentTime || 0;
    this.synths.forEach((synth) => {
      synth.allNotesOff(now);
    });
    this.activeNotes.forEach((_, key) => {
      this.activeNotes.set(key, []);
    });
  }

  pause(): void {
    this.scheduler?.pause();
  }

  resume(): void {
    this.scheduler?.resume();
  }

  // Recording methods
  startRecording(): void {
    if (!this.recorder) return;
    this.recorder.startRecording();
    if (this.recordingCallback) {
      this.recordingCallback(true);
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) return null;
    const blob = await this.recorder.stopRecording();
    if (this.recordingCallback) {
      this.recordingCallback(false);
    }
    return blob;
  }

  isRecording(): boolean {
    return this.recorder?.getIsRecording() ?? false;
  }

  // Trigger a drum sound immediately (for preview/pad hits)
  triggerDrum(drumId: string, velocity: number = 100): void {
    if (this.audioContext && this.drumKit) {
      this.drumKit.triggerDrum(drumId, this.audioContext.currentTime, velocity);
    }
  }

  // Trigger a synth note immediately (for preview)
  triggerSynthNote(synthIndex: number, note: number, velocity: number = 100): void {
    const synth = this.synths[synthIndex];
    if (this.audioContext && synth) {
      synth.noteOn(note, velocity, this.audioContext.currentTime);
      // Auto release after 200ms for preview
      setTimeout(() => {
        synth.noteOff(note, this.audioContext!.currentTime);
      }, 200);
    }
  }

  getCurrentStep(): number {
    return this.scheduler?.getCurrentStep() ?? 0;
  }

  getIsPlaying(): boolean {
    return this.scheduler !== null;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();

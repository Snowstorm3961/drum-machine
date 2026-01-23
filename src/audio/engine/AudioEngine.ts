import { Scheduler } from './Scheduler';
import { Recorder } from './Recorder';
import { DrumKit } from '../instruments/DrumKit';
import { Synth3xOsc } from '../instruments/Synth3xOsc';
import type { Step, SynthSettings, SynthPattern, AllDrumParams } from '../../types';
import { useSequenceStore, type InstrumentId } from '../../store/sequenceStore';
import { usePatternStore } from '../../store/patternStore';
import { useSynthStore } from '../../store/synthStore';

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
  private isAudioUnlocked: boolean = false;
  private stepCallback: StepCallback | null = null;
  private recordingCallback: RecordingCallback | null = null;

  // Pattern data - will be set from store
  private currentDrumPattern: Map<string, Step[]> = new Map();
  private currentSynthPatterns: SynthPattern[] = [];
  private synthsEnabled: boolean = true;

  // Track active notes for proper note-off handling
  private activeNotes: Map<string, { note: number; step: number }[]> = new Map();
  private lastStep: number = -1;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // iOS-specific audio unlock - must be called synchronously in a user gesture
  unlockAudio(): void {
    if (this.isAudioUnlocked && this.audioContext?.state === 'running') {
      return;
    }

    try {
      // Create AudioContext if it doesn't exist
      if (!this.audioContext) {
        // Use webkitAudioContext for older iOS versions
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        console.log('Created AudioContext, initial state:', this.audioContext.state);
      }

      // Resume synchronously (don't await - iOS needs this in the same call stack)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
        console.log('Called resume(), state:', this.audioContext.state);
      }

      // Method 1: Play a silent oscillator - more reliable on some iOS versions
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.001; // Nearly silent
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start(0);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        console.log('Played silent oscillator');
      } catch (e) {
        console.log('Oscillator unlock failed:', e);
      }

      // Method 2: Play a silent buffer as backup
      try {
        const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        console.log('Played silent buffer');
      } catch (e) {
        console.log('Buffer unlock failed:', e);
      }

      this.isAudioUnlocked = true;
      console.log('Audio unlock complete, context state:', this.audioContext.state);
    } catch (e) {
      console.error('Audio unlock failed:', e);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create audio context if not already created by unlockAudio
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }

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

    // Create recorder and connect masterGain to its destination
    // This connection is permanent - audio always flows through for recording
    this.recorder = new Recorder(this.audioContext);
    this.masterGain.connect(this.recorder.getDestination());

    this.isInitialized = true;
    console.log('AudioEngine initialized, context state:', this.audioContext.state);
  }

  async ensureResumed(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed, new state:', this.audioContext.state);
    }
  }

  private onStep(time: number, step: number): void {
    let seqState = useSequenceStore.getState();

    // Detect bar boundary (step wrapped from 15 to 0)
    if (step === 0 && this.lastStep === 15) {
      const instruments: InstrumentId[] = ['drums', 'synth-1', 'synth-2', 'synth-3'];
      for (const id of instruments) {
        if (seqState.modes[id] === 'sequence') {
          const activeId = seqState.activeSequenceIds[id];
          const cuedId = seqState.cuedSequenceIds[id];
          if (!activeId && cuedId) {
            // No active sequence but one is cued: activate it now
            seqState.setActiveSequence(id, cuedId);
            seqState.setCuedSequence(id, null);
          } else if (activeId) {
            // Advance the active sequence position
            seqState.advanceSequencePosition(id);
          }
        }
      }
      // Re-read state after advancing positions so pattern resolution uses the new position
      seqState = useSequenceStore.getState();
    }
    this.lastStep = step;

    // Resolve drum pattern for this step
    const drumPattern = this.resolveDrumPattern(seqState);
    drumPattern.forEach((steps, drumId) => {
      const stepData = steps[step];
      if (stepData && stepData.active) {
        this.drumKit?.triggerDrum(drumId, time, stepData.velocity);
      }
    });

    // Trigger synths for this step
    if (this.synthsEnabled) {
      for (let synthIndex = 0; synthIndex < this.synths.length; synthIndex++) {
        const synth = this.synths[synthIndex];
        if (!synth) continue;

        const pattern = this.resolveSynthPattern(synthIndex, seqState);
        if (!pattern) continue;

        const stepData = pattern.steps[step];
        const synthId = synth.id;
        const activeNotesForSynth = this.activeNotes.get(synthId) || [];

        // Get notes for this step
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
          return step === nextStep && !nextStepNotes.includes(n.note);
        });

        notesToRelease.forEach((n) => {
          synth.noteOff(n.note, time);
        });

        const remainingNotes = activeNotesForSynth.filter(
          (n) => !notesToRelease.some((r) => r.note === n.note && r.step === n.step)
        );

        if (stepData && stepData.active && stepNotes.length > 0) {
          stepNotes.forEach((note) => {
            const isAlreadyPlaying = remainingNotes.some((n) => n.note === note);
            if (!isAlreadyPlaying) {
              synth.noteOn(note, stepData.velocity, time);
              remainingNotes.push({ note, step });
            } else {
              // Update step for legato notes so the release check targets the correct next step
              const existing = remainingNotes.find((n) => n.note === note);
              if (existing) existing.step = step;
            }
          });
        }

        this.activeNotes.set(synthId, remainingNotes);
      }
    }

    // Notify UI of current step
    if (this.stepCallback) {
      this.stepCallback(step);
    }
  }

  private resolveDrumPattern(seqState: ReturnType<typeof useSequenceStore.getState>): Map<string, Step[]> {
    if (seqState.modes.drums === 'pattern') {
      return this.currentDrumPattern;
    }

    // Sequence mode: resolve from patternStore
    const activeSeqId = seqState.activeSequenceIds.drums;
    if (!activeSeqId) return this.currentDrumPattern;
    const seq = seqState.sequences.drums.find((s) => s.id === activeSeqId);
    if (!seq || seq.patternIds.length === 0) return this.currentDrumPattern;

    const pos = seqState.sequencePositions.drums;
    const patternIndex = seq.patternIds[pos % seq.patternIds.length];
    const patternStore = usePatternStore.getState();
    const pattern = patternStore.patterns[patternIndex];
    if (!pattern) return this.currentDrumPattern;

    const map = new Map<string, Step[]>();
    pattern.tracks.forEach((track) => {
      map.set(track.trackId, track.steps);
    });
    return map;
  }

  private resolveSynthPattern(synthIndex: number, seqState: ReturnType<typeof useSequenceStore.getState>): SynthPattern | null {
    const instrumentId = `synth-${synthIndex + 1}` as InstrumentId;

    if (seqState.modes[instrumentId] === 'pattern') {
      return this.currentSynthPatterns[synthIndex] || null;
    }

    // Sequence mode: resolve from synthStore
    const activeSeqId = seqState.activeSequenceIds[instrumentId];
    if (!activeSeqId) return this.currentSynthPatterns[synthIndex] || null;
    const seq = seqState.sequences[instrumentId].find((s) => s.id === activeSeqId);
    if (!seq || seq.patternIds.length === 0) return this.currentSynthPatterns[synthIndex] || null;

    const pos = seqState.sequencePositions[instrumentId];
    const patternIndex = seq.patternIds[pos % seq.patternIds.length];
    const synthState = useSynthStore.getState();
    return synthState.patterns[synthIndex]?.[patternIndex] || null;
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
    this.lastStep = -1;
    // Reset all sequence positions to beginning
    useSequenceStore.getState().resetAllPositions();
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

  // Drum parameter methods
  setDrumParams(drumId: keyof AllDrumParams, params: Record<string, number>): void {
    this.drumKit?.setDrumParams(drumId, params);
  }

  applyAllDrumParams(params: Partial<AllDrumParams>): void {
    this.drumKit?.applyAllDrumParams(params);
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();

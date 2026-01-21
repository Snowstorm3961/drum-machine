type SchedulerCallback = (time: number, step: number) => void;

export class Scheduler {
  private audioContext: AudioContext;
  private bpm: number = 120;
  private swing: number = 0; // 0-100, where 50 is "normal" swing, 0 is none
  private isRunning: boolean = false;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private scheduleAheadTime: number = 0.1; // 100ms look-ahead
  private schedulerInterval: number = 25; // Check every 25ms
  private intervalId: number | null = null;
  private callback: SchedulerCallback | null = null;
  private stepsPerBeat: number = 4; // 16th notes

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  getBpm(): number {
    return this.bpm;
  }

  setSwing(swing: number): void {
    // Swing is 0-100, where 0 = no swing, 50 = moderate, 100 = heavy
    this.swing = Math.max(0, Math.min(100, swing));
  }

  getSwing(): number {
    return this.swing;
  }

  setCallback(callback: SchedulerCallback): void {
    this.callback = callback;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  private getStepDuration(): number {
    // Duration of one 16th note in seconds
    return 60.0 / this.bpm / this.stepsPerBeat;
  }

  private getSwingOffset(step: number): number {
    // Apply swing to off-beat 16th notes (odd indices: 1, 3, 5, 7, 9, 11, 13, 15)
    // Swing delays these notes by a percentage of the step duration
    if (step % 2 === 1 && this.swing > 0) {
      const stepDuration = this.getStepDuration();
      // Max swing offset is 50% of step duration (which would make it a triplet feel)
      const maxSwingOffset = stepDuration * 0.5;
      return (this.swing / 100) * maxSwingOffset;
    }
    return 0;
  }

  private scheduleStep(): void {
    const swingOffset = this.getSwingOffset(this.currentStep);
    const scheduledTime = this.nextStepTime + swingOffset;

    if (this.callback) {
      this.callback(scheduledTime, this.currentStep);
    }

    this.nextStepTime += this.getStepDuration();
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduler(): void {
    // Schedule all steps that fall within the look-ahead window
    while (this.nextStepTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleStep();
    }
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime + 0.05; // Small initial delay

    this.intervalId = window.setInterval(() => {
      this.scheduler();
    }, this.schedulerInterval);
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentStep = 0;
  }

  pause(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.nextStepTime = this.audioContext.currentTime + 0.05;

    this.intervalId = window.setInterval(() => {
      this.scheduler();
    }, this.schedulerInterval);
  }
}

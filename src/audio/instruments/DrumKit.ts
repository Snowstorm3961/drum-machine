import type { IAudioInstrument, AllDrumParams } from '../../types';
import {
  KickSynth,
  SnareSynth,
  HiHatSynth,
  ClapSynth,
  TomSynth,
  RimSynth,
  CowbellSynth,
  CymbalSynth,
  CongaSynth,
} from '../synthesis';

type DrumSynth = {
  trigger(time: number, velocity: number): void;
  setVolume(volume: number): void;
  connect(destination: AudioNode): void;
  disconnect(): void;
};

export class DrumKit implements IAudioInstrument {
  id = 'drumkit';
  name = '808 Drum Kit';

  private audioContext: AudioContext;
  private output: GainNode;
  private synths: Map<string, DrumSynth> = new Map();
  private synthInstances: {
    kick: KickSynth;
    snare: SnareSynth;
    clap: ClapSynth;
    closedHat: HiHatSynth;
    openHat: HiHatSynth;
    tom: TomSynth;
    rim: RimSynth;
    cowbell: CowbellSynth;
    cymbal: CymbalSynth;
    conga: CongaSynth;
  } | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();
    this.output.gain.value = 1;

    this.initializeSynths();
  }

  private initializeSynths(): void {
    // Create all drum synths
    const kick = new KickSynth(this.audioContext);
    const snare = new SnareSynth(this.audioContext);
    const clap = new ClapSynth(this.audioContext);
    const closedHat = new HiHatSynth(this.audioContext, false);
    const openHat = new HiHatSynth(this.audioContext, true);
    const tom = new TomSynth(this.audioContext);
    const rim = new RimSynth(this.audioContext);
    const cowbell = new CowbellSynth(this.audioContext);
    const cymbal = new CymbalSynth(this.audioContext);
    const conga = new CongaSynth(this.audioContext);

    // Store typed instances for parameter access
    this.synthInstances = {
      kick, snare, clap, closedHat, openHat, tom, rim, cowbell, cymbal, conga
    };

    // Store in map
    this.synths.set('kick', kick);
    this.synths.set('snare', snare);
    this.synths.set('clap', clap);
    this.synths.set('closedHat', closedHat);
    this.synths.set('openHat', openHat);
    this.synths.set('tom', tom);
    this.synths.set('rim', rim);
    this.synths.set('cowbell', cowbell);
    this.synths.set('cymbal', cymbal);
    this.synths.set('conga', conga);

    // Connect all synths to output
    this.synths.forEach((synth) => {
      synth.connect(this.output);
    });
  }

  trigger(time: number, velocity: number): void {
    // This triggers all drums - typically you'd call triggerDrum instead
    this.synths.get('kick')?.trigger(time, velocity);
  }

  triggerDrum(drumId: string, time: number, velocity: number = 100): void {
    const synth = this.synths.get(drumId);
    if (synth) {
      synth.trigger(time, velocity);
    }
  }

  setDrumVolume(drumId: string, volume: number): void {
    const synth = this.synths.get(drumId);
    if (synth) {
      synth.setVolume(volume);
    }
  }

  setVolume(volume: number): void {
    this.output.gain.value = volume;
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getDrumIds(): string[] {
    return Array.from(this.synths.keys());
  }

  setDrumParams(drumId: keyof AllDrumParams, params: Record<string, number>): void {
    if (!this.synthInstances) return;
    const synth = this.synthInstances[drumId];
    if (synth && 'setParams' in synth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (synth as any).setParams(params);
    }
  }

  getDrumParams(drumId: keyof AllDrumParams): Record<string, number> | null {
    if (!this.synthInstances) return null;
    const synth = this.synthInstances[drumId];
    if (synth && 'getParams' in synth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (synth as any).getParams();
    }
    return null;
  }

  applyAllDrumParams(params: Partial<AllDrumParams>): void {
    (Object.keys(params) as (keyof AllDrumParams)[]).forEach((drumId) => {
      const drumParams = params[drumId];
      if (drumParams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.setDrumParams(drumId, drumParams as any);
      }
    });
  }
}

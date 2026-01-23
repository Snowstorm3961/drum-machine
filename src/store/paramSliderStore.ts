import { create } from 'zustand';
import { useDrumStore } from './drumStore';
import { useSynthStore } from './synthStore';
import type { AllDrumParams } from '../types';

export interface SliderSlot {
  targetId: string | null;
}

interface ParamSliderStore {
  slots: [SliderSlot, SliderSlot, SliderSlot, SliderSlot, SliderSlot];
  setSlotTarget: (slotIndex: number, targetId: string | null) => void;
}

export const useParamSliderStore = create<ParamSliderStore>((set) => ({
  slots: [
    { targetId: null },
    { targetId: null },
    { targetId: null },
    { targetId: null },
    { targetId: null },
  ],

  setSlotTarget: (slotIndex, targetId) =>
    set((state) => {
      const newSlots = [...state.slots] as [SliderSlot, SliderSlot, SliderSlot, SliderSlot, SliderSlot];
      newSlots[slotIndex] = { targetId };
      return { slots: newSlots };
    }),
}));

// Helper to read current value for a param id
export function getParamValue(id: string): number {
  if (id.startsWith('drum.')) {
    const parts = id.split('.');
    const drumId = parts[1] as keyof AllDrumParams;
    const param = parts[2];
    const drumParams = useDrumStore.getState().params;
    const drumData = drumParams[drumId];
    if (drumData && param in drumData) {
      return (drumData as unknown as Record<string, number>)[param];
    }
    return 0;
  }

  if (id.startsWith('synth.')) {
    const parts = id.split('.');
    const synthIndex = parseInt(parts[1], 10);
    const synthState = useSynthStore.getState();
    const synth = synthState.synths[synthIndex];
    if (!synth) return 0;

    if (parts[2] === 'volume') return synth.volume;
    if (parts[2] === 'envelope') return synth.envelope[parts[3] as keyof typeof synth.envelope] as number;
    if (parts[2] === 'filter') return synth.filter[parts[3] as keyof typeof synth.filter] as number;
    if (parts[2] === 'filterEnvelope') return synth.filterEnvelope[parts[3] as keyof typeof synth.filterEnvelope] as number;
    if (parts[2] === 'osc') {
      const oscIndex = parseInt(parts[3], 10);
      return synth.oscillators[oscIndex]?.volume ?? 0;
    }
  }

  return 0;
}

// Helper to set value for a param id
export function setParamValue(id: string, value: number): void {
  if (id.startsWith('drum.')) {
    const parts = id.split('.');
    const drumId = parts[1] as keyof AllDrumParams;
    const param = parts[2];
    useDrumStore.getState().updateDrumParam(drumId, param as never, value);
    return;
  }

  if (id.startsWith('synth.')) {
    const parts = id.split('.');
    const synthIndex = parseInt(parts[1], 10);
    const store = useSynthStore.getState();

    if (parts[2] === 'volume') {
      store.updateSynthVolume(synthIndex, value);
    } else if (parts[2] === 'envelope') {
      store.updateSynthEnvelope(synthIndex, { [parts[3]]: value });
    } else if (parts[2] === 'filter') {
      store.updateSynthFilter(synthIndex, { [parts[3]]: value });
    } else if (parts[2] === 'filterEnvelope') {
      store.updateSynthFilterEnvelope(synthIndex, { [parts[3]]: value });
    } else if (parts[2] === 'osc') {
      const oscIndex = parseInt(parts[3], 10);
      store.updateSynthOscillator(synthIndex, oscIndex, { volume: value });
    }
  }
}

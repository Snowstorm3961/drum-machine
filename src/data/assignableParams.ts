export interface AssignableParam {
  id: string;
  label: string;
  category: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

// Drum parameters
const drumNames: { id: string; label: string }[] = [
  { id: 'kick', label: 'Kick' },
  { id: 'snare', label: 'Snare' },
  { id: 'closedHat', label: 'CH' },
  { id: 'openHat', label: 'OH' },
  { id: 'clap', label: 'Clap' },
  { id: 'tom', label: 'Tom' },
  { id: 'cowbell', label: 'Cowbell' },
  { id: 'cymbal', label: 'Cymbal' },
  { id: 'rim', label: 'Rim' },
  { id: 'conga', label: 'Conga' },
];

const drumParamDefs: { drums: string[]; param: string; label: string; min: number; max: number; step: number; defaultValue: number }[] = [
  { drums: ['kick', 'snare', 'tom', 'cowbell', 'rim', 'conga'], param: 'pitch', label: 'Pitch', min: 0.5, max: 2, step: 0.01, defaultValue: 1 },
  { drums: ['kick', 'snare', 'closedHat', 'openHat', 'clap', 'tom', 'cowbell', 'cymbal', 'rim', 'conga'], param: 'decay', label: 'Decay', min: 0.5, max: 3, step: 0.01, defaultValue: 1 },
  { drums: ['kick', 'closedHat', 'openHat', 'clap', 'cymbal'], param: 'tone', label: 'Tone', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  { drums: ['snare'], param: 'snappy', label: 'Snappy', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
];

function buildDrumParams(): AssignableParam[] {
  const params: AssignableParam[] = [];
  for (const drum of drumNames) {
    params.push({
      id: `drum.${drum.id}.volume`,
      label: `${drum.label} Vol`,
      category: 'Drums',
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 1,
    });
    for (const def of drumParamDefs) {
      if (def.drums.includes(drum.id)) {
        params.push({
          id: `drum.${drum.id}.${def.param}`,
          label: `${drum.label} ${def.label}`,
          category: 'Drums',
          min: def.min,
          max: def.max,
          step: def.step,
          defaultValue: def.defaultValue,
        });
      }
    }
  }
  return params;
}

function buildSynthParams(): AssignableParam[] {
  const params: AssignableParam[] = [];
  for (let i = 0; i < 3; i++) {
    const label = `Synth ${i + 1}`;
    const prefix = `synth.${i}`;
    params.push(
      { id: `${prefix}.volume`, label: `${label} Vol`, category: label, min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
      { id: `${prefix}.envelope.attack`, label: `${label} Atk`, category: label, min: 0, max: 2, step: 0.01, defaultValue: 0.01 },
      { id: `${prefix}.envelope.decay`, label: `${label} Dec`, category: label, min: 0, max: 2, step: 0.01, defaultValue: 0.2 },
      { id: `${prefix}.envelope.sustain`, label: `${label} Sus`, category: label, min: 0, max: 1, step: 0.01, defaultValue: 0.6 },
      { id: `${prefix}.envelope.release`, label: `${label} Rel`, category: label, min: 0, max: 4, step: 0.01, defaultValue: 0.3 },
      { id: `${prefix}.filter.frequency`, label: `${label} Filt`, category: label, min: 20, max: 20000, step: 1, defaultValue: 4000 },
      { id: `${prefix}.filter.resonance`, label: `${label} Res`, category: label, min: 0.1, max: 20, step: 0.1, defaultValue: 1 },
      { id: `${prefix}.filterEnvelope.amount`, label: `${label} FEnv`, category: label, min: -1, max: 1, step: 0.01, defaultValue: 0.5 },
    );
    for (let o = 0; o < 3; o++) {
      params.push({
        id: `${prefix}.osc.${o}.volume`,
        label: `${label} Osc${o + 1} Vol`,
        category: label,
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: o < 2 ? 0.4 : 0,
      });
    }
  }
  return params;
}

export const ASSIGNABLE_PARAMS: AssignableParam[] = [
  ...buildDrumParams(),
  ...buildSynthParams(),
];

export function getParamById(id: string): AssignableParam | undefined {
  return ASSIGNABLE_PARAMS.find((p) => p.id === id);
}

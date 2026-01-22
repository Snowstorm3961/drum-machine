import { memo, useCallback } from 'react';
import { useSynthStore } from '../../store';
import type { OscillatorWaveform } from '../../types';

interface SynthControlsProps {
  synthIndex: number;
}

const WAVEFORMS: OscillatorWaveform[] = ['sine', 'triangle', 'sawtooth', 'square'];

// Reusable ADSR slider with text input
interface ADSRSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  isPercentage?: boolean;
}

function ADSRSlider({ label, value, min, max, step, onChange, unit = 's', isPercentage = false }: ADSRSliderProps) {
  const displayValue = isPercentage ? Math.round(value * 100) : value.toFixed(2);
  const displayUnit = isPercentage ? '%' : unit;

  return (
    <div className="flex flex-col items-center">
      <label className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>
      <input
        type="number"
        min={isPercentage ? 0 : min}
        max={isPercentage ? 100 : max}
        step={isPercentage ? 1 : step}
        value={displayValue}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            const newValue = isPercentage ? val / 100 : val;
            onChange(Math.max(min, Math.min(max, newValue)));
          }
        }}
        className="w-14 px-1 py-0.5 text-xs text-center font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)] mb-1"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-24 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
        style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '24px' }}
      />
      <span className="text-xs text-[var(--color-text-secondary)] mt-1">{displayUnit}</span>
    </div>
  );
}

export const SynthControls = memo(function SynthControls({ synthIndex }: SynthControlsProps) {
  const { synths, updateSynthOscillator, updateSynthEnvelope, updateSynthFilter, updateSynthFilterEnvelope, updateSynthVolume } =
    useSynthStore();
  const synth = synths[synthIndex];

  const handleOscChange = useCallback(
    (oscIndex: number, key: string, value: number | string | boolean) => {
      updateSynthOscillator(synthIndex, oscIndex, { [key]: value });
    },
    [synthIndex, updateSynthOscillator]
  );

  const handleEnvChange = useCallback(
    (key: string, value: number) => {
      updateSynthEnvelope(synthIndex, { [key]: value });
    },
    [synthIndex, updateSynthEnvelope]
  );

  const handleFilterChange = useCallback(
    (key: string, value: number | string | boolean) => {
      updateSynthFilter(synthIndex, { [key]: value });
    },
    [synthIndex, updateSynthFilter]
  );

  const handleFilterEnvChange = useCallback(
    (key: string, value: number) => {
      updateSynthFilterEnvelope(synthIndex, { [key]: value });
    },
    [synthIndex, updateSynthFilterEnvelope]
  );

  return (
    <div className="space-y-4">
      {/* Oscillators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {synth.oscillators.map((osc, oscIndex) => (
          <div
            key={oscIndex}
            className={`p-3 rounded-lg ${osc.enabled ? 'bg-[var(--color-bg-tertiary)]' : 'bg-[var(--color-bg-primary)] opacity-50'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">OSC {oscIndex + 1}</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={osc.enabled}
                  onChange={(e) => handleOscChange(oscIndex, 'enabled', e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                <span className="text-xs">On</span>
              </label>
            </div>

            {/* Waveform */}
            <div className="mb-2">
              <label className="text-xs text-[var(--color-text-secondary)]">Wave</label>
              <div className="flex gap-1 mt-1">
                {WAVEFORMS.map((wf) => (
                  <button
                    key={wf}
                    onClick={() => handleOscChange(oscIndex, 'waveform', wf)}
                    className={`flex-1 py-1 text-xs rounded ${
                      osc.waveform === wf
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    {wf.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Coarse tuning */}
            <div className="mb-2">
              <label className="text-xs text-[var(--color-text-secondary)]">
                Coarse: {osc.coarse > 0 ? '+' : ''}{osc.coarse} st
              </label>
              <input
                type="range"
                min="-24"
                max="24"
                value={osc.coarse}
                onChange={(e) => handleOscChange(oscIndex, 'coarse', parseInt(e.target.value))}
                className="w-full h-1 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>

            {/* Fine tuning */}
            <div className="mb-2">
              <label className="text-xs text-[var(--color-text-secondary)]">
                Fine: {osc.fine > 0 ? '+' : ''}{osc.fine} ct
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={osc.fine}
                onChange={(e) => handleOscChange(oscIndex, 'fine', parseInt(e.target.value))}
                className="w-full h-1 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">
                Vol: {Math.round(osc.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={osc.volume * 100}
                onChange={(e) => handleOscChange(oscIndex, 'volume', parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Envelope & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ADSR Envelope */}
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <span className="text-sm font-bold mb-3 block">AMP ENVELOPE</span>
          <div className="flex justify-around">
            <ADSRSlider
              label="A"
              value={synth.envelope.attack}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => handleEnvChange('attack', v)}
            />
            <ADSRSlider
              label="D"
              value={synth.envelope.decay}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => handleEnvChange('decay', v)}
            />
            <ADSRSlider
              label="S"
              value={synth.envelope.sustain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => handleEnvChange('sustain', v)}
              isPercentage
            />
            <ADSRSlider
              label="R"
              value={synth.envelope.release}
              min={0}
              max={4}
              step={0.01}
              onChange={(v) => handleEnvChange('release', v)}
            />
          </div>
        </div>

        {/* Filter Envelope */}
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <span className="text-sm font-bold mb-3 block">FILTER ENVELOPE</span>
          <div className="flex justify-around">
            <ADSRSlider
              label="A"
              value={synth.filterEnvelope.attack}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => handleFilterEnvChange('attack', v)}
            />
            <ADSRSlider
              label="D"
              value={synth.filterEnvelope.decay}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => handleFilterEnvChange('decay', v)}
            />
            <ADSRSlider
              label="S"
              value={synth.filterEnvelope.sustain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => handleFilterEnvChange('sustain', v)}
              isPercentage
            />
            <ADSRSlider
              label="R"
              value={synth.filterEnvelope.release}
              min={0}
              max={4}
              step={0.01}
              onChange={(v) => handleFilterEnvChange('release', v)}
            />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Amount</label>
              <input
                type="number"
                min={-1}
                max={1}
                step={0.01}
                value={synth.filterEnvelope.amount.toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleFilterEnvChange('amount', Math.max(-1, Math.min(1, val)));
                  }
                }}
                className="w-16 px-1 py-0.5 text-xs text-right font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={synth.filterEnvelope.amount}
              onChange={(e) => handleFilterEnvChange('amount', parseFloat(e.target.value))}
              className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">FILTER</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={synth.filter.enabled}
                onChange={(e) => handleFilterChange('enabled', e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="text-xs">On</span>
            </label>
          </div>

          <div className="space-y-3">
            {/* Filter type */}
            <div className="flex gap-1">
              {(['lowpass', 'highpass', 'bandpass'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('type', type)}
                  className={`flex-1 py-1 text-xs rounded ${
                    synth.filter.type === type
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {type.slice(0, 2).toUpperCase()}
                </button>
              ))}
            </div>

            {/* Frequency */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[var(--color-text-secondary)]">Cutoff</label>
                <input
                  type="number"
                  min={20}
                  max={20000}
                  step={10}
                  value={synth.filter.frequency}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      handleFilterChange('frequency', Math.max(20, Math.min(20000, val)));
                    }
                  }}
                  className="w-20 px-1 py-0.5 text-xs text-right font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <input
                type="range"
                min="20"
                max="20000"
                value={synth.filter.frequency}
                onChange={(e) => handleFilterChange('frequency', parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>

            {/* Resonance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[var(--color-text-secondary)]">Resonance</label>
                <input
                  type="number"
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={synth.filter.resonance.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      handleFilterChange('resonance', Math.max(0.1, Math.min(20, val)));
                    }
                  }}
                  className="w-16 px-1 py-0.5 text-xs text-right font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={synth.filter.resonance * 10}
                onChange={(e) => handleFilterChange('resonance', parseInt(e.target.value) / 10)}
                className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Master Volume */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Volume:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={synth.volume * 100}
          onChange={(e) => updateSynthVolume(synthIndex, parseInt(e.target.value) / 100)}
          className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
        />
        <span className="text-sm font-mono w-12">{Math.round(synth.volume * 100)}%</span>
      </div>
    </div>
  );
});

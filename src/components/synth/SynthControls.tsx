import { memo, useCallback } from 'react';
import { useSynthStore } from '../../store';
import type { OscillatorWaveform } from '../../types';

interface SynthControlsProps {
  synthIndex: number;
}

const WAVEFORMS: OscillatorWaveform[] = ['sine', 'triangle', 'sawtooth', 'square'];

export const SynthControls = memo(function SynthControls({ synthIndex }: SynthControlsProps) {
  const { synths, updateSynthOscillator, updateSynthEnvelope, updateSynthFilter, updateSynthVolume } =
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ADSR Envelope */}
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <span className="text-sm font-bold mb-2 block">ENVELOPE</span>
          <div className="grid grid-cols-4 gap-2">
            {(['attack', 'decay', 'sustain', 'release'] as const).map((param) => (
              <div key={param}>
                <label className="text-xs text-[var(--color-text-secondary)] block text-center">
                  {param[0].toUpperCase()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={param === 'sustain' ? 100 : param === 'release' ? 400 : 200}
                  value={param === 'sustain' ? synth.envelope[param] * 100 : synth.envelope[param] * 100}
                  onChange={(e) =>
                    handleEnvChange(
                      param,
                      param === 'sustain'
                        ? parseInt(e.target.value) / 100
                        : parseInt(e.target.value) / 100
                    )
                  }
                  className="w-full h-16 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
                <span className="text-xs text-[var(--color-text-secondary)] block text-center">
                  {param === 'sustain'
                    ? `${Math.round(synth.envelope[param] * 100)}%`
                    : `${synth.envelope[param].toFixed(2)}s`}
                </span>
              </div>
            ))}
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

          <div className="space-y-2">
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
              <label className="text-xs text-[var(--color-text-secondary)]">
                Freq: {synth.filter.frequency}Hz
              </label>
              <input
                type="range"
                min="20"
                max="20000"
                value={synth.filter.frequency}
                onChange={(e) => handleFilterChange('frequency', parseInt(e.target.value))}
                className="w-full h-1 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>

            {/* Resonance */}
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">
                Res: {synth.filter.resonance.toFixed(1)}
              </label>
              <input
                type="range"
                min="1"
                max="200"
                value={synth.filter.resonance * 10}
                onChange={(e) => handleFilterChange('resonance', parseInt(e.target.value) / 10)}
                className="w-full h-1 bg-[var(--color-bg-primary)] rounded appearance-none cursor-pointer accent-[var(--color-accent)]"
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

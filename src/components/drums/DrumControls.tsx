import { memo, useCallback } from 'react';
import { useDrumStore, drumParamConfigs } from '../../store';
import { DRUM_SOUNDS } from '../../data/drumKit';
import type { AllDrumParams } from '../../types';

export const DrumControls = memo(function DrumControls() {
  const { params, selectedDrum, setSelectedDrum, updateDrumParam, resetDrumParams } = useDrumStore();

  const handleParamChange = useCallback(
    (drumId: keyof AllDrumParams, param: string, value: number) => {
      updateDrumParam(drumId, param as keyof AllDrumParams[typeof drumId], value);
    },
    [updateDrumParam]
  );

  const selectedDrumConfig = selectedDrum ? drumParamConfigs[selectedDrum] : null;
  const selectedDrumParams = selectedDrum ? params[selectedDrum] : null;
  const selectedDrumInfo = selectedDrum
    ? DRUM_SOUNDS.find((s) => s.id === selectedDrum)
    : null;

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">Drum Sound Editor</h3>
        {selectedDrum && (
          <button
            onClick={() => resetDrumParams(selectedDrum)}
            className="text-xs px-2 py-1 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-primary)] rounded transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Drum selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {DRUM_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => setSelectedDrum(sound.id as keyof AllDrumParams)}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${
              selectedDrum === sound.id
                ? 'ring-2 ring-white ring-opacity-50'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: sound.color }}
          >
            {sound.shortName}
          </button>
        ))}
      </div>

      {/* Parameter controls */}
      {selectedDrum && selectedDrumConfig && selectedDrumParams && (
        <div className="space-y-3">
          <div
            className="text-sm font-medium px-2 py-1 rounded inline-block"
            style={{ backgroundColor: selectedDrumInfo?.color }}
          >
            {selectedDrumInfo?.name}
          </div>

          {selectedDrumConfig.map((config) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = (selectedDrumParams as any)[config.param] ?? 1;
            const percentage = ((value - config.min) / (config.max - config.min)) * 100;

            return (
              <div key={config.param} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--color-text-secondary)]">
                    {config.label}
                  </label>
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value.toFixed(2)}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      if (!isNaN(newValue)) {
                        handleParamChange(selectedDrum, config.param,
                          Math.max(config.min, Math.min(config.max, newValue)));
                      }
                    }}
                    className="w-16 px-1 py-0.5 text-xs text-right font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={value}
                  onChange={(e) => handleParamChange(selectedDrum, config.param, parseFloat(e.target.value))}
                  className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-bg-primary) ${percentage}%, var(--color-bg-primary) 100%)`,
                  }}
                />
              </div>
            );
          })}

          {/* Volume control - always present */}
          <div className="space-y-1 pt-2 border-t border-[var(--color-bg-tertiary)]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-text-secondary)]">Volume</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={selectedDrumParams.volume.toFixed(2)}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (!isNaN(newValue)) {
                    handleParamChange(selectedDrum, 'volume', Math.max(0, Math.min(1, newValue)));
                  }
                }}
                className="w-16 px-1 py-0.5 text-xs text-right font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selectedDrumParams.volume}
              onChange={(e) => handleParamChange(selectedDrum, 'volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-[var(--color-bg-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              style={{
                background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${selectedDrumParams.volume * 100}%, var(--color-bg-primary) ${selectedDrumParams.volume * 100}%, var(--color-bg-primary) 100%)`,
              }}
            />
          </div>
        </div>
      )}

      {!selectedDrum && (
        <div className="text-sm text-[var(--color-text-secondary)] text-center py-4">
          Select a drum sound above to edit its parameters
        </div>
      )}
    </div>
  );
});

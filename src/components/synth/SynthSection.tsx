import { memo, useState } from 'react';
import { useSynthStore } from '../../store';
import { SynthControls } from './SynthControls';
import { SynthSequencer } from './SynthSequencer';
import { Button } from '../ui/Button';

export const SynthSection = memo(function SynthSection() {
  const { synths, selectedSynthIndex, setSelectedSynth, synthsEnabled, setSynthsEnabled, clearPattern, transposeCurrentPattern } =
    useSynthStore();
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">
            Synthesizers
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={synthsEnabled}
              onChange={(e) => setSynthsEnabled(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <span className="text-xs text-[var(--color-text-secondary)]">Enabled</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => clearPattern(selectedSynthIndex)}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Synth tabs */}
      <div className="flex gap-2 mb-4">
        {synths.map((synth, index) => (
          <button
            key={synth.id}
            onClick={() => setSelectedSynth(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSynthIndex === index
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'
            }`}
          >
            {synth.name}
          </button>
        ))}
      </div>

      {synthsEnabled && (
        <>
          {/* Synth controls */}
          {showControls && (
            <div className="mb-4">
              <SynthControls synthIndex={selectedSynthIndex} />
            </div>
          )}

          {/* Transpose controls + Piano roll sequencer */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Transpose</span>
            <button
              onClick={() => transposeCurrentPattern(selectedSynthIndex, -1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] text-sm font-bold"
              title="Transpose down 1 semitone"
            >
              -
            </button>
            <button
              onClick={() => transposeCurrentPattern(selectedSynthIndex, 1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] text-sm font-bold"
              title="Transpose up 1 semitone"
            >
              +
            </button>
          </div>
          <div className="border border-[var(--color-bg-tertiary)] rounded-lg overflow-hidden">
            <SynthSequencer synthIndex={selectedSynthIndex} />
          </div>
        </>
      )}

      {!synthsEnabled && (
        <div className="text-center text-[var(--color-text-secondary)] py-8">
          Synthesizers are disabled. Enable them to start creating melodies.
        </div>
      )}
    </div>
  );
});

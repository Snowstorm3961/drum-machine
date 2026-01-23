import { memo, useCallback } from 'react';
import { useTransportStore, usePatternStore } from '../../store';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { Button } from '../ui/Button';
import { MIN_BPM, MAX_BPM } from '../../data/drumKit';

export const TransportControls = memo(function TransportControls() {
  const { bpm, swing, setBpm, setSwing } = useTransportStore();
  const { clearPattern, currentPatternId } = usePatternStore();
  const {
    isRecording,
    startRecording,
    stopRecordingAndDownload,
  } = useAudioEngine();

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      await stopRecordingAndDownload();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecordingAndDownload]);

  const handleBpmChange = useCallback(
    (delta: number) => {
      setBpm(bpm + delta);
    },
    [bpm, setBpm]
  );

  const handleBpmInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        setBpm(value);
      }
    },
    [setBpm]
  );

  const handleSwingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSwing(parseInt(e.target.value, 10));
    },
    [setSwing]
  );

  const handleClear = useCallback(() => {
    clearPattern(currentPatternId);
  }, [clearPattern, currentPatternId]);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl">
      {/* Record button */}
      <Button
        variant={isRecording ? 'primary' : 'secondary'}
        size="lg"
        onClick={handleRecord}
        className={`min-w-[100px] ${isRecording ? 'animate-pulse bg-red-600 hover:bg-red-700' : ''}`}
        aria-label={isRecording ? 'Stop Recording' : 'Record'}
      >
        <span className="flex items-center gap-2">
          <RecordIcon isRecording={isRecording} />
          {isRecording ? 'Stop Rec' : 'Record'}
        </span>
      </Button>

      {/* BPM controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">BPM</span>
        <Button variant="ghost" size="sm" onClick={() => handleBpmChange(-5)} aria-label="Decrease BPM by 5">
          -5
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleBpmChange(-1)} aria-label="Decrease BPM by 1">
          -1
        </Button>
        <input
          type="number"
          value={bpm}
          onChange={handleBpmInput}
          min={MIN_BPM}
          max={MAX_BPM}
          className="w-16 px-2 py-1 text-center text-lg font-mono bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-bg-tertiary)] focus:outline-none focus:border-[var(--color-accent)]"
          aria-label="BPM value"
        />
        <Button variant="ghost" size="sm" onClick={() => handleBpmChange(1)} aria-label="Increase BPM by 1">
          +1
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleBpmChange(5)} aria-label="Increase BPM by 5">
          +5
        </Button>
      </div>

      {/* Swing control */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">Swing</span>
        <input
          type="range"
          min="0"
          max="100"
          value={swing}
          onChange={handleSwingChange}
          className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
          aria-label="Swing amount"
        />
        <span className="w-8 text-sm font-mono text-[var(--color-text-secondary)]">{swing}%</span>
      </div>

      {/* Clear pattern button */}
      <Button variant="secondary" size="md" onClick={handleClear} aria-label="Clear pattern">
        Clear
      </Button>
    </div>
  );
});

function RecordIcon({ isRecording }: { isRecording: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="6" fill={isRecording ? '#ff4444' : 'currentColor'} />
    </svg>
  );
}

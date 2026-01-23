import { memo, useCallback } from 'react';
import { useTransportStore, useProjectStore } from '../../store';
import { useAudioEngine } from '../../hooks/useAudioEngine';

export const PlayBar = memo(function PlayBar() {
  const { state } = useTransportStore();
  const { masterVolume, setMasterVolume } = useProjectStore();
  const { initialize, play, stop } = useAudioEngine();

  const isPlaying = state === 'playing';

  const handlePlayStop = useCallback(async () => {
    await initialize();
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, initialize, play, stop]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-11 bg-[var(--color-bg-secondary)] border-b border-[var(--color-bg-tertiary)] flex items-center px-4 gap-4">
      {/* Play/Stop button */}
      <button
        onClick={handlePlayStop}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0"
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? <StopIcon /> : <PlayIcon />}
      </button>

      {/* Volume slider */}
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <VolumeIcon />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
          aria-label="Master volume"
        />
      </div>
    </div>
  );
});

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2l10 6-10 6V2z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--color-text-secondary)] flex-shrink-0">
      <path d="M8 1.5l-4 3H1v7h3l4 3V1.5zM11 5.5a3 3 0 010 5M13 3.5a6 6 0 010 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

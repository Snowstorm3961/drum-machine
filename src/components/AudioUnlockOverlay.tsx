import { useState, useCallback } from 'react';

interface AudioUnlockOverlayProps {
  onUnlock: () => void;
}

export function AudioUnlockOverlay({ onUnlock }: AudioUnlockOverlayProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUnlocking) return;
    setIsUnlocking(true);

    // Create AudioContext directly in the tap handler - this is critical for iOS
    const AudioContextClass = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const ctx = new AudioContextClass();

    // Resume immediately (synchronously call, don't await)
    const resumePromise = ctx.resume();

    // Create and play an oscillator - more reliable than buffer on some iOS versions
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Make it silent
    gainNode.gain.value = 0.001;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 440;
    oscillator.start(0);
    oscillator.stop(ctx.currentTime + 0.1);

    // Also play a silent buffer as backup
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.log('Buffer approach failed:', e);
    }

    // Wait for resume to complete, then close this context and proceed
    resumePromise.then(() => {
      console.log('Audio unlocked, context state:', ctx.state);
      // Close this temporary context - the app will create its own
      ctx.close().catch(() => {});
      onUnlock();
    }).catch((err) => {
      console.error('Failed to resume audio:', err);
      // Try to proceed anyway
      ctx.close().catch(() => {});
      onUnlock();
    });
  }, [isUnlocking, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      <div className="text-center p-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isUnlocking ? 'Starting...' : 'Tap to Enable Audio'}
        </h2>
        <p className="text-gray-400 text-sm">
          iOS requires a tap to enable sound
        </p>
      </div>
    </div>
  );
}

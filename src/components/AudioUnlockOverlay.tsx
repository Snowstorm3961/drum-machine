import { useState, useCallback } from 'react';
import { audioEngine } from '../audio/engine/AudioEngine';

interface AudioUnlockOverlayProps {
  onUnlock: () => void;
}

export function AudioUnlockOverlay({ onUnlock }: AudioUnlockOverlayProps) {
  const [status, setStatus] = useState<'ready' | 'unlocking' | 'failed'>('ready');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleTap = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === 'unlocking') return;
    setStatus('unlocking');
    setDebugInfo('Starting unlock...');

    try {
      // Unlock audio synchronously in this gesture handler
      audioEngine.unlockAudio();

      // Initialize the engine
      await audioEngine.initialize();

      // Get context state for debugging
      const ctx = audioEngine.getAudioContext();
      const state = ctx?.state || 'no context';
      setDebugInfo(`Context: ${state}`);

      // Try to play a test sound
      if (ctx && ctx.state === 'running') {
        // Play a brief audible beep to confirm audio works
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);

        setDebugInfo(`Audio working! State: ${state}`);

        // Small delay to let the beep play
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        // Context not running - try resume again
        if (ctx) {
          await ctx.resume();
          setDebugInfo(`After resume: ${ctx.state}`);
          if (ctx.state === 'running') {
            setTimeout(() => onUnlock(), 100);
          } else {
            setStatus('failed');
            setDebugInfo(`Failed - state: ${ctx.state}. Try turning off silent mode.`);
          }
        } else {
          setStatus('failed');
          setDebugInfo('No AudioContext created');
        }
      }
    } catch (err) {
      setStatus('failed');
      setDebugInfo(`Error: ${err}`);
      console.error('Audio unlock error:', err);
    }
  }, [status, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      <div className="text-center p-8 max-w-sm">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {status === 'ready' && 'Tap to Enable Audio'}
          {status === 'unlocking' && 'Enabling...'}
          {status === 'failed' && 'Tap to Retry'}
        </h2>

        <p className="text-gray-400 text-sm mb-4">
          {status === 'ready' && 'Tap anywhere to start'}
          {status === 'unlocking' && 'Please wait...'}
          {status === 'failed' && 'Make sure silent mode is OFF'}
        </p>

        {/* Debug info - helpful for troubleshooting */}
        {debugInfo && (
          <p className="text-xs text-gray-500 mt-4 font-mono">
            {debugInfo}
          </p>
        )}

        <p className="text-xs text-gray-600 mt-6">
          Tip: Turn OFF the silent switch on the side of your iPhone
        </p>
      </div>
    </div>
  );
}

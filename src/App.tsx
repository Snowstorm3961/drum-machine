import { useEffect, useRef } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TransportControls } from './components/transport/TransportControls';
import { StepSequencer } from './components/sequencer/StepSequencer';
import { PatternSelector } from './components/pattern/PatternSelector';
import { DrumControls } from './components/drums/DrumControls';
import { SynthSection } from './components/synth/SynthSection';
import { ArrangementView } from './components/arrangement/ArrangementView';
import { useAudioEngine } from './hooks/useAudioEngine';
import { audioEngine } from './audio/engine/AudioEngine';

function App() {
  const { initialize } = useAudioEngine();
  const hasUnlocked = useRef(false);

  // Initialize audio on first user interaction
  // iOS requires audio unlock to happen SYNCHRONOUSLY in a user gesture
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasUnlocked.current) return;
      hasUnlocked.current = true;

      // CRITICAL: Call unlockAudio synchronously - do NOT await anything before this
      // iOS requires this to be in the direct call stack of the user gesture
      audioEngine.unlockAudio();

      // Now we can initialize asynchronously
      initialize();

      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
    };

    // Listen for multiple event types - iOS sometimes needs touchend
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('touchend', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
    };
  }, [initialize]);

  return (
    <AppShell>
      <TransportControls />
      <PatternSelector />
      <StepSequencer />
      <DrumControls />
      <SynthSection />
      <ArrangementView />
    </AppShell>
  );
}

export default App;

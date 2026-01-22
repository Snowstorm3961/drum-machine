import { useState, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TransportControls } from './components/transport/TransportControls';
import { StepSequencer } from './components/sequencer/StepSequencer';
import { PatternSelector } from './components/pattern/PatternSelector';
import { DrumControls } from './components/drums/DrumControls';
import { SynthSection } from './components/synth/SynthSection';
import { ArrangementView } from './components/arrangement/ArrangementView';
import { AudioUnlockOverlay } from './components/AudioUnlockOverlay';
import { useAudioEngine } from './hooks/useAudioEngine';
import { audioEngine } from './audio/engine/AudioEngine';

function App() {
  const { initialize } = useAudioEngine();
  const [showOverlay, setShowOverlay] = useState(true);

  const handleAudioUnlock = useCallback(() => {
    // The overlay already unlocked audio with a temporary context
    // Now unlock with our main engine and initialize
    audioEngine.unlockAudio();
    initialize();
    setShowOverlay(false);
  }, [initialize]);

  return (
    <>
      {showOverlay && <AudioUnlockOverlay onUnlock={handleAudioUnlock} />}
      <AppShell>
        <TransportControls />
        <PatternSelector />
        <StepSequencer />
        <DrumControls />
        <SynthSection />
        <ArrangementView />
      </AppShell>
    </>
  );
}

export default App;

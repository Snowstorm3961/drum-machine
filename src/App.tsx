import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TransportControls } from './components/transport/TransportControls';
import { StepSequencer } from './components/sequencer/StepSequencer';
import { PatternSelector } from './components/pattern/PatternSelector';
import { SynthSection } from './components/synth/SynthSection';
import { ArrangementView } from './components/arrangement/ArrangementView';
import { useAudioEngine } from './hooks/useAudioEngine';

function App() {
  const { initialize } = useAudioEngine();

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      await initialize();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [initialize]);

  return (
    <AppShell>
      <TransportControls />
      <PatternSelector />
      <StepSequencer />
      <SynthSection />
      <ArrangementView />
    </AppShell>
  );
}

export default App;

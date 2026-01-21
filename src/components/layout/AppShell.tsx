import type { ReactNode } from 'react';
import { useProjectStore } from '../../store';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { projectName, masterVolume, setMasterVolume } = useProjectStore();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--color-bg-secondary)] border-b border-[var(--color-bg-tertiary)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">808</h1>
            <span className="text-sm text-[var(--color-text-secondary)]">{projectName}</span>
          </div>

          {/* Master volume */}
          <div className="flex items-center gap-2">
            <label htmlFor="master-volume" className="text-xs text-[var(--color-text-secondary)] uppercase">
              Vol
            </label>
            <input
              id="master-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-20 h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              aria-label="Master volume"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">{children}</div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[var(--color-text-secondary)] py-4">
        Tap pads to preview sounds. Tap steps to program beats.
      </footer>
    </div>
  );
}

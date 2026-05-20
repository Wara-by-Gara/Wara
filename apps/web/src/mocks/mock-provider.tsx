'use client';

import { useEffect, useState } from 'react';

let startPromise: Promise<void> | null = null;

async function startWorker() {
  if (startPromise) return startPromise;
  const { worker } = await import('./browser');
  startPromise = worker.start({ onUnhandledRequest: 'bypass' }).then(() => undefined);
  return startPromise;
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startWorker().then(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

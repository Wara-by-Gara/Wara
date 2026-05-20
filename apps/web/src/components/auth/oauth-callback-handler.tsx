'use client';

import { Suspense } from 'react';
import { useOAuthCallback } from '@/hooks/useOAuthCallback';

function OAuthCallbackInner() {
  useOAuthCallback();
  return null;
}

export function OAuthCallbackHandler() {
  return (
    <Suspense>
      <OAuthCallbackInner />
    </Suspense>
  );
}

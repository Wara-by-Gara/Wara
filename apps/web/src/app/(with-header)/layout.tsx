import { OAuthCallbackHandler } from '@/components/auth/oauth-callback-handler';

export default function WithHeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OAuthCallbackHandler />
      {children}
    </>
  );
}

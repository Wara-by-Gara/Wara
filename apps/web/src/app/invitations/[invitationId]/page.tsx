import type { Metadata } from 'next';
import { Suspense } from 'react';
import InvitationDetailContainer from '@/domain/InvitationDetail/Container/InvitationDetailContainer';
import type { Invitation } from '@/lib/api/invitations';
import { API_ORIGIN } from '@/lib/env';

interface Props {
  params: Promise<{ invitationId: string }>;
}

async function fetchInvitation(invitationId: string): Promise<Invitation | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/invitations/${invitationId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json() as { success: boolean; data: Invitation };
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invitationId } = await params;
  const invitation = await fetchInvitation(invitationId);

  const title = invitation?.title ?? 'WARA 초대장';
  const description = invitation?.description ?? '초대장이 도착했어요!';

  let ogImage: string;
  if (invitation?.mainCoverType === 'gif') {
    ogImage = `${API_ORIGIN}/api/og-image?id=${invitationId}`;
  } else {
    ogImage = invitation?.mainImageThumbnailUrl ?? invitation?.mainImageUrl ?? '/wara-logo.png';
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/invitations/${invitationId}`,
      images: [{ url: ogImage }],
    },
  };
}

export default async function InvitationsDetailPage({ params }: Props) {
  const { invitationId } = await params;
  return (
    <Suspense>
      <InvitationDetailContainer invitationId={invitationId} />
    </Suspense>
  );
}

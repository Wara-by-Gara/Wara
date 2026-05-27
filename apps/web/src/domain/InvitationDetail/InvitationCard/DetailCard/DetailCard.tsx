import { InvitationCover } from '@/components/organisms/InvitationCover/InvitationCover';
import { Avatar } from '@/components/primitives/Avatar';
import { Invitation } from '@/lib/api/invitations';

interface Props {
  invitation: Invitation;
}

export default function DetailCard({ invitation }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <InvitationCover
        variant={invitation.mainImageUrl ? 'image' : 'no-image'}
        imageUrl={invitation.mainImageUrl}
      />
      <header className="flex flex-col items-start gap-2 px-1 text-left">
        <h1 className="text-[26px] font-extrabold text-text-primary">{invitation.title}</h1>
        {invitation.host && (
          <span className="flex items-center gap-2 text-[13px] text-text-tertiary">
            <Avatar
              src={invitation.host.profileImageUrl ?? undefined}
              alt={invitation.host.nickname ?? '호스트'}
              size="xs"
            />
            <span>{invitation.host.nickname ?? '호스트'}</span>
          </span>
        )}
        {invitation.description && (
          <p className="whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary">{invitation.description}</p>
        )}
      </header>
    </div>
  );
}
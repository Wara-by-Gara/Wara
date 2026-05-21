"use client";

import type { CreatedInvitation } from "@/lib/api/invitations";
import { useShareInvitation } from "@/hooks/useShareInvitation";
import InvitationPreviewCard from "./InvitationPreviewCard";
import ShareLinkBox from "./ShareLinkBox";
import SocialShareButtons from "./SocialShareButtons";

interface Props {
  invitation: CreatedInvitation;
  onGoToGatherings: () => void;
}

export default function ShareModal({ invitation, onGoToGatherings }: Props) {
  const { copyLink, shareViaSms, shareViaInstagram, copied } = useShareInvitation(invitation.id);
  const displayUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/i/${invitation.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-2xl">
        <InvitationPreviewCard invitation={invitation} />

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-wara-body flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3.5 9L7.5 13L14.5 5.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-bold text-sm text-wara-body underline">
              Invitation Created Successfully!
            </p>
          </div>

          <ShareLinkBox shareUrl={displayUrl} onCopy={copyLink} copied={copied} />

          <SocialShareButtons onSms={shareViaSms} onInstagram={shareViaInstagram} />

          <button
            onClick={onGoToGatherings}
            className="w-full bg-wara-body text-white font-semibold py-3.5 rounded-xl text-sm"
          >
            Go to My Gatherings
          </button>
        </div>
      </div>
    </div>
  );
}

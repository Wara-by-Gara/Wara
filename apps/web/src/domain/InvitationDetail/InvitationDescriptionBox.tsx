import { cn } from "@/lib/cn";

interface InvitationDescriptionBoxProps {
  children: string;
  fontClass?: string;
}

export function InvitationDescriptionBox({ children, fontClass }: InvitationDescriptionBoxProps) {
  return (
    <div className="rounded-md border border-white/40 bg-white/20 px-4 py-3 shadow-xs backdrop-blur-md backdrop-saturate-150">
      <p className={cn("whitespace-pre-line text-left text-[15px] leading-[1.6] text-text-primary", fontClass)}>
        {children}
      </p>
    </div>
  );
}

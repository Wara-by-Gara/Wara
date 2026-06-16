import { cn } from "@/lib/cn";

interface InvitationDescriptionBoxProps {
  children: string;
  fontClass?: string;
  bgColor?: string;
}

export function InvitationDescriptionBox({ children, fontClass, bgColor }: InvitationDescriptionBoxProps) {
  const isDarkBg = bgColor?.includes('aurora') || bgColor?.includes('starry');
  return (
    <div className="rounded-md border border-white/40 bg-white/20 px-4 py-3 shadow-xs backdrop-blur-md backdrop-saturate-150">
      <p className={cn("whitespace-pre-line text-left text-[15px] leading-[1.6]", isDarkBg ? "text-white" : "text-text", fontClass)}>
        {children}
      </p>
    </div>
  );
}

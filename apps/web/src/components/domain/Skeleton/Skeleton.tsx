import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const skeletonVariants = cva("animate-pulse bg-border", {
  variants: {
    radius: {
      sm: "rounded-xs",
      md: "rounded-sm",
      lg: "rounded-md",
      xl: "rounded-lg",
      full: "rounded-full",
    },
  },
  defaultVariants: { radius: "md" },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, radius, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ radius }), className)}
        aria-hidden="true"
        {...props}
      />
    );
  },
);

export const InvitationCardSkeleton = () => (
  <div className="flex w-full flex-col gap-3 overflow-hidden rounded-md border border-border bg-surface p-3">
    <Skeleton className="aspect-square w-full" radius="lg" />
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  </div>
);

export const InvitationDetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* 커버 — 실제 커버 비율(약 4:5)에 맞춘 적당한 크기 (전체를 덮는 거대 블록 X) */}
    <Skeleton className="mx-auto aspect-[4/5] w-full max-w-xs" radius="xl" />

    {/* 제목 + 일정 */}
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-2/5" />
    </div>

    {/* 설명 박스 */}
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
    </div>

    {/* 정보 (호스트·장소·정원·링크) — 아이콘 + 라벨/값 행 */}
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0" radius="full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className={cn("h-4", i % 2 ? "w-1/2" : "w-2/3")} />
          </div>
        </div>
      ))}
    </div>

    {/* 참석자 — 제목 + 겹친 아바타 행 */}
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-28" />
      <div className="flex -space-x-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="size-10 ring-2 ring-surface" radius="full" />
        ))}
      </div>
    </div>

    {/* RSVP — 이모지 원 3개 + 라벨 */}
    <div className="flex justify-center gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="size-16" radius="full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>

    {/* 사진 피드 + 댓글 */}
    <InvitationFeedSkeleton />
  </div>
);

export const ParticipantSummarySkeleton = () => (
  <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-14" />
    </div>
    <div className="flex">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  </div>
);

export const ParticipantListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="rounded-lg bg-surface px-2 py-1">
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-1 py-3">
          <Skeleton className="size-10 shrink-0" radius="full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-12" radius="full" />
            </div>
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CommentListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="px-4 py-2">
        <div className="flex items-start gap-3">
          <Skeleton className="size-8 shrink-0" radius="full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const AlbumGridSkeleton = ({ count = 9 }: { count?: number }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="aspect-square w-full" radius="md" />
    ))}
  </div>
);

export const InvitationAlbumSectionSkeleton = () => (
  <div className="rounded-md border border-border bg-surface p-4">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="size-8 shrink-0" radius="full" />
    </div>
    <AlbumGridSkeleton count={6} />
  </div>
);

export const InvitationFeedSkeleton = () => (
  <div className="flex flex-col gap-4">
    <InvitationAlbumSectionSkeleton />
    <CommentListSkeleton count={3} />
  </div>
);

export const NotificationListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 px-4 py-3">
        <Skeleton className="size-10 shrink-0" radius="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export const RemindAlbumHeaderSkeleton = () => (
  <div className="shrink-0 border-b border-border bg-surface px-page py-4">
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0" radius="full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <Skeleton className="h-8 w-16" radius="full" />
    </div>
    <div className="mt-3 flex gap-2">
      <Skeleton className="h-7 w-24" radius="full" />
      <Skeleton className="h-7 w-28" radius="full" />
    </div>
  </div>
);

export const EventListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="flex flex-col divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <Skeleton className="size-[120px] shrink-0" radius="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
    ))}
  </div>
);

export const HorizontalInvitationListSkeleton = ({ count = 3 }: { count?: number }) => (
  <EventListSkeleton count={count} />
);

export const TemplateRowSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="-mx-page flex gap-3 overflow-hidden px-page pb-1">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex w-[140px] shrink-0 flex-col gap-2">
        <Skeleton className="aspect-square w-full" radius="md" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    ))}
  </div>
);

export const FriendsPageSkeleton = () => (
  <>
    <section className="pt-3">
      <Skeleton className="mx-page mb-2 h-4 w-28" />
      <div className="flex gap-5 overflow-hidden px-page">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
            <Skeleton className="size-16" radius="full" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </section>
    <section className="mt-3 px-page">
      <Skeleton className="mb-3 h-10 w-full" radius="md" />
      <div className="divide-y divide-border rounded-md bg-surface">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-10 shrink-0" radius="full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  </>
);

export const FriendProfilePageSkeleton = () => (
  <>
    <section className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary-soft/40 to-surface px-page pb-7 pt-8">
      <Skeleton className="size-24" radius="full" />
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="mt-2 h-10 w-28" radius="lg" />
    </section>
    <section className="px-page py-5">
      <Skeleton className="mb-3 h-4 w-28" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="size-14 shrink-0" radius="full" />
        ))}
      </div>
    </section>
    <section className="px-page pb-6">
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <InvitationCardSkeleton key={i} />
        ))}
      </div>
    </section>
  </>
);

export const RsvpPageSkeleton = () => (
  <div className="flex flex-col gap-5 px-page py-6">
    <Skeleton className="aspect-[4/3] w-full" radius="lg" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-12 flex-1" radius="lg" />
      <Skeleton className="h-12 flex-1" radius="lg" />
      <Skeleton className="h-12 flex-1" radius="lg" />
    </div>
    <Skeleton className="h-24 w-full" radius="md" />
    <Skeleton className="h-12 w-full" radius="lg" />
  </div>
);

export const SignupFormSkeleton = () => (
  <div className="flex flex-col items-center gap-6 px-page py-10">
    <Skeleton className="size-24" radius="full" />
    <div className="flex w-full flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-12 w-full" radius="md" />
        </div>
      ))}
      <Skeleton className="mt-2 h-12 w-full" radius="lg" />
    </div>
  </div>
);

export const TextContentSkeleton = ({ lines = 12 }: { lines?: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn("h-3.5", i % 4 === 3 ? "w-2/3" : "w-full")}
      />
    ))}
  </div>
);

export const FaqListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="size-4 shrink-0" radius="sm" />
      </div>
    ))}
  </div>
);

export const InquiryListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14" radius="full" />
          <Skeleton className="h-5 w-16" radius="full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

export const InquiryDetailSkeleton = () => (
  <div className="px-page pb-6 pt-6">
    <div className="mb-3 flex flex-wrap gap-1.5">
      <Skeleton className="h-6 w-14" radius="full" />
      <Skeleton className="h-6 w-16" radius="full" />
    </div>
    <Skeleton className="mb-4 h-6 w-4/5" />
    <Skeleton className="mb-6 h-3.5 w-1/3" />
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i % 3 === 2 ? "w-4/5" : "w-full")} />
      ))}
    </div>
  </div>
);

export const MentionListSkeleton = ({ count = 3 }: { count?: number }) => (
  <ul>
    {Array.from({ length: count }).map((_, i) => (
      <li key={i} className="flex items-center gap-3 px-4 py-2.5">
        <Skeleton className="size-8 shrink-0" radius="full" />
        <Skeleton className="h-4 w-1/3" />
      </li>
    ))}
  </ul>
);

export const LoadMoreSkeleton = () => (
  <div className="flex justify-center py-3" aria-hidden="true">
    <Skeleton className="h-4 w-16" />
  </div>
);

export const GifGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-2 pb-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="aspect-video w-full" radius="sm" />
    ))}
  </div>
);

export const MapLoadingSkeleton = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/70" aria-hidden="true">
    <Skeleton className="h-full w-full" />
  </div>
);

export const SettingsToggleListSkeleton = ({ count = 7 }: { count?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center justify-between px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-11" radius="full" />
      </div>
    ))}
  </div>
);

export const TermsAgreeSkeleton = () => (
  <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full" />
    </div>
    <Skeleton className="h-14 w-full" radius="sm" />
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" radius="sm" />
      ))}
    </div>
    <Skeleton className="h-12 w-full" radius="sm" />
  </div>
);

export const ProfileSkeleton = () => (
  <>
    <section className="flex flex-col items-center gap-4 bg-surface pb-8 pt-[88px]">
      <div className="relative">
        <Skeleton className="size-28" radius="full" />
        <Skeleton className="absolute bottom-1 right-1 size-9" radius="full" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </section>

    <section className="py-3">
      <Skeleton className="mx-5 mb-2 h-4 w-20" />
      <div className="flex gap-3 overflow-hidden px-page">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-56 shrink-0">
            <InvitationCardSkeleton />
          </div>
        ))}
      </div>
    </section>

    <section className="py-2">
      <div className="divide-y divide-border bg-surface">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-page py-4">
            <Skeleton className="size-10 shrink-0" radius="md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto size-4" radius="sm" />
          </div>
        ))}
      </div>
    </section>
  </>
);

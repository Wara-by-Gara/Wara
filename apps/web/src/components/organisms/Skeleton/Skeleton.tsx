import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const skeletonVariants = cva("animate-pulse bg-border", {
  variants: {
    radius: {
      sm: "rounded-md",
      md: "rounded-lg",
      lg: "rounded-2xl",
      xl: "rounded-3xl",
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
  <div className="flex w-full flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-surface p-3">
    <Skeleton className="aspect-square w-full" radius="lg" />
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  </div>
);

export const InvitationDetailSkeleton = () => (
  <div className="flex flex-col gap-5">
    <Skeleton className="aspect-[4/5] min-h-72 w-full" radius="xl" />

    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 shrink-0" radius="full" />
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>

    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton className="h-[88px] w-full" radius="xl" />
      <Skeleton className="h-[120px] w-full" radius="xl" />
    </div>

    <div className="rounded-3xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="size-12 shrink-0" radius="full" />
        ))}
      </div>
    </div>

    <div className="flex gap-2">
      <Skeleton className="h-12 flex-1" radius="lg" />
      <Skeleton className="h-12 flex-1" radius="lg" />
      <Skeleton className="h-12 flex-1" radius="lg" />
    </div>

    <InvitationFeedSkeleton />
  </div>
);

export const ParticipantSummarySkeleton = () => (
  <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4">
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
  <div className="rounded-3xl bg-surface px-2 py-1">
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
  <div className="rounded-3xl border border-border bg-surface p-4">
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
  <div className="shrink-0 border-b border-border bg-surface px-5 py-4">
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
      <div className="flex gap-3 overflow-hidden px-5">
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
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="size-10 shrink-0" radius="md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto size-4" radius="sm" />
          </div>
        ))}
      </div>
    </section>
  </>
);

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const skeletonVariants = cva("animate-pulse bg-gray-200", {
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

const wrapClass = "flex flex-col gap-3";

export const InvitationCardSkeleton = () => (
  <div className={cn(wrapClass, "rounded-3xl border border-border bg-surface p-4")}>
    <Skeleton className="h-44 w-full" radius="lg" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const InvitationDetailSkeleton = () => (
  <div className={wrapClass}>
    <Skeleton className="h-56 w-full" radius="lg" />
    <Skeleton className="h-7 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
    <div className="mt-4 flex flex-col gap-3">
      <Skeleton className="h-24 w-full" radius="lg" />
      <Skeleton className="h-24 w-full" radius="lg" />
    </div>
  </div>
);

export const ParticipantListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className={wrapClass}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-10" radius="full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-6 w-12" radius="full" />
      </div>
    ))}
  </div>
);

export const CommentListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={wrapClass}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <Skeleton className="size-9 shrink-0" radius="full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
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

export const NotificationListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className={wrapClass}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
        <Skeleton className="size-8 shrink-0" radius="full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex flex-col items-center gap-3 py-6">
    <Skeleton className="size-20" radius="full" />
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-24" />
  </div>
);

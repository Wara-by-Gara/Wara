"use client";

import { Drawer } from "vaul";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const BottomSheet = Drawer.Root;
export const BottomSheetTrigger = Drawer.Trigger;
export const BottomSheetClose = Drawer.Close;
export const BottomSheetPortal = Drawer.Portal;

export const BottomSheetOverlay = forwardRef<
  React.ComponentRef<typeof Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
>(function BottomSheetOverlay({ className, ...props }, ref) {
  return (
    <Drawer.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-black/48", className)}
      {...props}
    />
  );
});

export interface BottomSheetContentProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Drawer.Content>,
    "title"
  > {
  title?: ReactNode;
  description?: ReactNode;
  /** Handle 표시 (기본 true) */
  showHandle?: boolean;
  /** Storybook 베젤 등 부모(relative) 안에 시트를 맞출 때 */
  contained?: boolean;
}

export const BottomSheetContent = forwardRef<
  React.ComponentRef<typeof Drawer.Content>,
  BottomSheetContentProps
>(function BottomSheetContent(
  { className, children, title, description, showHandle = true, contained = false, ...props },
  ref,
) {
  const overlayClass = cn(
    "z-50 bg-black/48",
    contained ? "absolute inset-0" : "fixed inset-0",
  );
  const contentClass = cn(
    "z-50 flex flex-col rounded-t-3xl bg-surface focus:outline-none",
    "pb-[env(safe-area-inset-bottom)]",
    contained
      ? "absolute inset-x-0 bottom-0 max-h-[min(72%,480px)] w-full"
      : "fixed inset-x-0 bottom-0 mt-24 max-h-[85vh]",
    className,
  );

  const body = (
    <>
      <BottomSheetOverlay className={overlayClass} />
      <Drawer.Content ref={ref} className={contentClass} {...props}>
        {showHandle ? (
          <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-gray-300" aria-hidden />
        ) : null}
        {(title || description) ? (
          <div className="px-5 pt-4">
            {title ? (
              <Drawer.Title className="text-[18px] font-bold text-text-primary">
                {title}
              </Drawer.Title>
            ) : null}
            {description ? (
              <Drawer.Description className="mt-1 text-[14px] text-text-secondary">
                {description}
              </Drawer.Description>
            ) : null}
          </div>
        ) : null}
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </Drawer.Content>
    </>
  );

  if (contained) {
    return body;
  }

  return <Drawer.Portal>{body}</Drawer.Portal>;
});

"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function LumaCollapse({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <Icon
          name="chevron-right"
          size="sm"
          color="tertiary"
          decorative
          className={cn("transition-transform duration-300", open && "rotate-90")}
        />
      </button>
      {open ? <div className="pb-3 text-sm text-text-secondary">{children}</div> : null}
    </div>
  );
}

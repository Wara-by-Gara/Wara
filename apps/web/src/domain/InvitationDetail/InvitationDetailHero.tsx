'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  cover: ReactNode;
  title: string;
  schedule?: string;
  fontClass?: string;
  meta?: ReactNode;
  isDarkBg?: boolean;
};

export function InvitationDetailHero({
  cover,
  title,
  schedule,
  fontClass,
  meta,
  isDarkBg = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4 pt-4">
      {cover}
      <header className="flex flex-col gap-3 text-left">
        {meta}
        <div className="flex flex-col gap-2">
          <h1
            className={cn(
              'text-[28px] font-bold leading-[1.15] tracking-tight',
              isDarkBg ? 'text-white' : 'text-text-primary',
              fontClass,
            )}
          >
            {title}
          </h1>
          {schedule ? (
            <p
              className={cn(
                'text-[17px] leading-[1.35] text-text-secondary',
                isDarkBg ? 'text-white' : 'text-text-secondary',
              )}
            >
              {schedule}
            </p>
          ) : null}
        </div>
      </header>
    </div>
  );
}

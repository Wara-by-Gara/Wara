'use client';

import type { ButtonHTMLAttributes } from 'react';
import { PROVIDER_CONFIGS, type SocialProvider } from './providers';

export interface SocialLoginButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  provider: SocialProvider;
  loading?: boolean;
}

export function SocialLoginButton({
  provider,
  loading = false,
  disabled = false,
  className = '',
  ...props
}: SocialLoginButtonProps) {
  const { Icon, label, variantClass } = PROVIDER_CONFIGS[provider];
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      aria-busy={loading}
      disabled={isDisabled}
      className={[
        'relative flex h-13 w-full items-center justify-center',
        'rounded-xs text-[15px] font-semibold leading-none',
        'transition-colors duration-150 active:opacity-90',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span
        className="absolute left-4 flex h-5 w-5 items-center justify-center"
        aria-hidden="true"
      >
        {loading ? (
          <span className="block h-4.5 w-4.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          <Icon className="h-full w-full" />
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

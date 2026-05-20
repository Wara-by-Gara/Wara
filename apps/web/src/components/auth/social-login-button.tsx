'use client';

import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SocialLoginButton({ icon, label, onClick, disabled = false, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-3 w-full h-12 rounded-xl font-medium text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

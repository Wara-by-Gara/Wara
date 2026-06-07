"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useId, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const inputShell = cva(
  [
    "flex w-full items-center gap-2 border text-base transition-colors duration-300",
    "h-[38px] rounded-xs px-3.5 py-2.5",
  ],
  {
    variants: {
      variant: {
        default: "border-border-strong bg-surface text-text-primary",
        solid: "border-border-strong bg-background-soft text-text-primary",
        naked: "border-transparent bg-transparent px-0 hover:bg-gray-50",
        rounded: "rounded-full",
        error: "border-red-500 text-text-primary",
        success: "border-green-500 text-text-primary",
        disabled: "cursor-not-allowed opacity-50",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface LumaInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputShell> {
  label?: string;
  error?: string;
  clearable?: boolean;
  leftAccessory?: string;
  rightAccessory?: string;
}

export const LumaInput = forwardRef<HTMLInputElement, LumaInputProps>(function LumaInput(
  { className, variant, label, error, clearable, leftAccessory, rightAccessory, value, onChange, disabled, ...props },
  ref,
) {
  const id = useId();
  const resolved = error ? "error" : disabled ? "disabled" : variant;
  const [internal, setInternal] = useState("");
  const val = value !== undefined ? String(value) : internal;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className={cn("text-sm", error ? "text-red-500" : "text-text-secondary")}>
          {label}
        </label>
      ) : null}
      <div className={cn(inputShell({ variant: resolved }), className)}>
        {leftAccessory ? (
          <span className="rounded-xs bg-gray-100 px-2 py-0.5 text-xs text-text-secondary">{leftAccessory}</span>
        ) : null}
        {variant === "success" ? <Icon name="check-circle" size="sm" color="success" decorative /> : null}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          value={val}
          onChange={(e) => {
            setInternal(e.target.value);
            onChange?.(e);
          }}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-text-tertiary"
          {...props}
        />
        {clearable && val ? (
          <button type="button" onClick={() => setInternal("")} className="text-text-tertiary hover:text-text-primary">
            <Icon name="x" size="sm" color="currentColor" decorative />
          </button>
        ) : null}
        {rightAccessory ? (
          <span className="rounded-xs bg-gray-100 px-2 py-0.5 text-xs text-text-secondary">{rightAccessory}</span>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
});

export function LumaTextarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label ? <label htmlFor={id} className="text-sm text-text-secondary">{label}</label> : null}
      <textarea
        id={id}
        className={cn(
          "min-h-[80px] w-full resize-y rounded-sm border border-border-strong bg-surface px-3 py-2 text-base leading-normal outline-none placeholder:text-text-tertiary",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function LumaCheckbox({
  label,
  danger,
  checked = false,
  onChange,
  disabled,
}: {
  label: string;
  danger?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2", disabled && "cursor-not-allowed opacity-50")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded border border-border-strong bg-surface transition-colors",
          checked && !danger && "border-primary bg-primary",
          checked && danger && "border-red-500 bg-red-500",
        )}
      >
        {checked ? <Icon name="check" size="xs" color="currentColor" decorative className="text-white" /> : null}
      </span>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

export function LumaRadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xs bg-gray-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-xs px-3 py-1.5 text-sm transition-colors",
            value === opt ? "bg-white font-semibold text-text-primary shadow-xs" : "text-text-secondary hover:text-text-primary",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function LumaSelect({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <p className="text-sm text-text-secondary">{label}</p> : null}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-full appearance-none rounded-xs border border-border-strong bg-surface px-3.5 text-base outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <Icon name="chevron-down" size="sm" color="tertiary" decorative className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

export function LumaMultiSelect({ tags }: { tags: string[] }) {
  return (
    <div className="flex min-h-[38px] flex-wrap gap-1.5 rounded-sm border border-border-strong bg-surface p-2">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-text-primary">
          {tag}
          <Icon name="x" size="xs" color="currentColor" decorative />
        </span>
      ))}
    </div>
  );
}

export function LumaCountSelector({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-surface px-2">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-8 items-center justify-center rounded-xs text-text-secondary hover:bg-gray-50 disabled:opacity-40"
      >
        <Icon name="minus" size="sm" color="currentColor" decorative />
      </button>
      <span className="min-w-[2ch] text-center text-base font-medium">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-8 items-center justify-center rounded-xs text-text-secondary hover:bg-gray-50 disabled:opacity-40"
      >
        <Icon name="plus" size="sm" color="currentColor" decorative />
      </button>
    </div>
  );
}

export function LumaInputWithSubmit({
  placeholder,
  submitLabel = "제출",
}: {
  placeholder?: string;
  submitLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <LumaInput placeholder={placeholder} className="flex-1" />
      <button
        type="button"
        className="h-[38px] shrink-0 rounded-xs bg-primary px-3.5 text-sm font-medium text-text-inverse transition-colors hover:bg-primary-hover"
      >
        {submitLabel}
      </button>
    </div>
  );
}

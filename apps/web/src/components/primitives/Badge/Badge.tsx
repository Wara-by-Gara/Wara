import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        attending: "bg-green-50 text-green-600",
        maybe: "bg-yellow-50 text-yellow-400",
        declined: "bg-gray-100 text-gray-600",
        noResponse: "bg-gray-50 text-gray-500",
        dday: "bg-pink-100 text-pink-600",
        today: "bg-pink-500 text-text-inverse",
        ended: "bg-gray-100 text-gray-500",
        private: "bg-sky-100 text-sky-500",
        host: "bg-yellow-100 text-yellow-400",
        new: "bg-pink-500 text-text-inverse",
        uploading: "bg-sky-100 text-sky-500",
        error: "bg-red-50 text-red-600",
      },
      strength: {
        soft: "",
        default: "",
        strong: "font-bold",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        md: "h-7 px-2.5 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "attending",
      strength: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, strength, size, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, strength, size }), className)}
      {...props}
    />
  );
});

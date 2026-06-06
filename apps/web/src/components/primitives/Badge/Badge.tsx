import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        attending: "bg-green-50 text-green-600",
        maybe: "bg-yellow-50 text-yellow-600",
        declined: "bg-gray-100 text-gray-600",
        noResponse: "bg-gray-50 text-gray-500",
        dday: "bg-cranberry-10 text-cranberry-60",
        today: "bg-cranberry-50 text-text-inverse",
        ended: "bg-gray-100 text-gray-500",
        private: "bg-blue-100 text-blue-600",
        host: "bg-yellow-100 text-yellow-600",
        new: "bg-cranberry-50 text-text-inverse",
        uploading: "bg-blue-100 text-blue-600",
        error: "bg-red-50 text-red-600",
      },
      strength: {
        soft: "",
        default: "",
        strong: "font-semibold",
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

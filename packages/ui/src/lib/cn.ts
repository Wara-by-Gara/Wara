import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스 병합 (조건부 + 충돌 해소) */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

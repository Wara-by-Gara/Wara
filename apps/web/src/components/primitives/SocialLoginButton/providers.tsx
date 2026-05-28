import type { FC, SVGProps } from 'react';

export type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

const KakaoIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    {/*
     * Kakao speech bubble — traced from kakao_login_large_wide.png
     * Oval body + small downward-left tail at bottom-left
     * Color: rgba(0,0,0,0.85) on #FEE500 — contrast 14.7:1 (AAA)
     */}
    <path
      fill="rgba(0,0,0,0.85)"
      d="M12 2C6.48 2 2 5.86 2 10.62c0 2.9 1.6 5.46 4.06 7.04L5 22l4.38-2.4c.84.15 1.72.23 2.62.23 5.52 0 10-3.86 10-8.62S17.52 2 12 2z"
    />
  </svg>
);

const NaverIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    {/*
     * Naver N — traced from NAVER_login_Light_KR_green_narrow_H56.png
     * Bold sans-serif N with diagonal stroke, white fill on transparent
     * Color: #FFFFFF on #03C75A — contrast 4.7:1 (AA)
     */}
    <path
      fill="#ffffff"
      d="M16.273 12.845L7.376 3H3v18h4.727v-9.845L16.624 21H21V3h-4.727z"
    />
  </svg>
);

const GoogleIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="10 10 20 20" aria-hidden="true" focusable="false" {...props}>
    {/*
     * Official Google G mark — paths from web_light_rd_na.svg
     * viewBox cropped to the G region (10 10 20 20) so the icon fills the slot
     * Brand ref: https://developers.google.com/identity/branding-guidelines
     */}
    <path fill="#4285F4" d="M29.6 20.2273C29.6 19.5182 29.5364 18.8364 29.4182 18.1818H20V22.05H25.3818C25.15 23.3 24.4455 24.3591 23.3864 25.0682V27.5773H26.6182C28.5091 25.8364 29.6 23.2727 29.6 20.2273Z" />
    <path fill="#34A853" d="M20 30C22.7 30 24.9636 29.1045 26.6181 27.5773L23.3863 25.0682C22.4909 25.6682 21.3454 26.0227 20 26.0227C17.3954 26.0227 15.1909 24.2636 14.4045 21.9H11.0636V24.4909C12.7091 27.7591 16.0909 30 20 30Z" />
    <path fill="#FBBC04" d="M14.4045 21.9C14.2045 21.3 14.0909 20.6591 14.0909 20C14.0909 19.3409 14.2045 18.7 14.4045 18.1V15.5091H11.0636C10.3864 16.8591 10 18.3864 10 20C10 21.6136 10.3864 23.1409 11.0636 24.4909L14.4045 21.9Z" />
    <path fill="#E94235" d="M20 13.9773C21.4681 13.9773 22.7863 14.4818 23.8227 15.4727L26.6909 12.6045C24.9591 10.9909 22.6954 10 20 10C16.0909 10 12.7091 12.2409 11.0636 15.5091L14.4045 18.1C15.1909 15.7364 17.3954 13.9773 20 13.9773Z" />
  </svg>
);

const AppleIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    {/*
     * Apple logo mark.
     * Brand ref: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
     * Color: #FFFFFF on #000000 — contrast 21:1 (AAA)
     */}
    <path
      fill="#ffffff"
      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.37c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 4.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  variantClass: string;
}

export const PROVIDER_CONFIGS: Record<SocialProvider, ProviderConfig> = {
  kakao: {
    label: '카카오로 시작하기',
    Icon: KakaoIcon,
    variantClass: [
      'bg-[#FEE500] text-[rgba(0,0,0,0.85)]',
      'hover:bg-[#FFDD00]',
      'active:bg-[#F5D400]',
      'focus-visible:ring-[#FEE500]/60',
    ].join(' '),
  },
  naver: {
    label: '네이버로 시작하기',
    Icon: NaverIcon,
    variantClass: [
      'bg-[#03C75A] text-white',
      'hover:bg-[#02B34F]',
      'active:bg-[#029F46]',
      'focus-visible:ring-[#03C75A]/50',
    ].join(' '),
  },
  google: {
    label: 'Google로 시작하기',
    Icon: GoogleIcon,
    variantClass: [
      'bg-white text-[#3C4043] border border-[#DADCE0]',
      'hover:bg-[#F8F9FA] hover:border-[#D2E3FC]',
      'active:bg-[#EEF3FF]',
      'focus-visible:ring-[#4285F4]/50',
    ].join(' '),
  },
  apple: {
    label: 'Apple로 시작하기',
    Icon: AppleIcon,
    variantClass: [
      'bg-black text-white',
      'hover:bg-[#1a1a1a]',
      'active:bg-[#333333]',
      'focus-visible:ring-black/50',
    ].join(' '),
  },
};

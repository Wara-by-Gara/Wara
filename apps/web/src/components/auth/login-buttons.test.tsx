import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KakaoLoginButton } from './kakao-login-button';
import { NaverLoginButton } from './naver-login-button';
import { GoogleLoginButton } from './google-login-button';

const hrefSetter = vi.fn();

beforeEach(() => {
  hrefSetter.mockClear();
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { set href(url: string) { hrefSetter(url); } },
  });
});

describe('KakaoLoginButton', () => {
  it('"카카오로 계속하기" 라벨을 렌더링한다', () => {
    render(<KakaoLoginButton />);
    expect(screen.getByText('카카오로 계속하기')).toBeInTheDocument();
  });

  it('클릭 시 카카오 redirect URL로 이동한다', () => {
    render(<KakaoLoginButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining('/auth/kakao/redirect'),
    );
  });

  it('버튼이 활성화 상태다', () => {
    render(<KakaoLoginButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

describe('NaverLoginButton', () => {
  it('"네이버로 계속하기" 라벨을 렌더링한다', () => {
    render(<NaverLoginButton />);
    expect(screen.getByText('네이버로 계속하기')).toBeInTheDocument();
  });

  it('클릭 시 네이버 redirect URL로 이동한다', () => {
    render(<NaverLoginButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining('/auth/naver/redirect'),
    );
  });

  it('버튼이 활성화 상태다', () => {
    render(<NaverLoginButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

describe('GoogleLoginButton', () => {
  it('"Google로 계속하기" 라벨을 렌더링한다', () => {
    render(<GoogleLoginButton />);
    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument();
  });

  it('버튼이 비활성화 상태다', () => {
    render(<GoogleLoginButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('클릭해도 URL 이동이 발생하지 않는다', () => {
    render(<GoogleLoginButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(hrefSetter).not.toHaveBeenCalled();
  });
});

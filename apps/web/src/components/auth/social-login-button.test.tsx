import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialLoginButton } from './social-login-button';

describe('SocialLoginButton', () => {
  it('라벨을 렌더링한다', () => {
    render(<SocialLoginButton icon={<span>icon</span>} label="테스트 버튼" />);
    expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
  });

  it('아이콘을 렌더링한다', () => {
    render(<SocialLoginButton icon={<span data-testid="icon">icon</span>} label="버튼" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('클릭 시 onClick을 호출한다', () => {
    const onClick = vi.fn();
    render(<SocialLoginButton icon={<span />} label="버튼" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled=true 시 버튼이 비활성화된다', () => {
    render(<SocialLoginButton icon={<span />} label="버튼" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disabled=true 시 onClick이 호출되지 않는다', () => {
    const onClick = vi.fn();
    render(<SocialLoginButton icon={<span />} label="버튼" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

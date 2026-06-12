'use client';

import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';
import { Switch } from '@/components/primitives/Switch';
import { Divider } from '@/components/primitives/Divider';
import { MenuItem } from '@/components/molecules/MenuItem';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { ConfirmModal } from '@/components/molecules/Modal';
import { Radio, RadioGroup } from '@/components/primitives/Radio';
import { Textarea } from '@/components/primitives/Textarea';
import { Button } from '@/components/primitives/Button';
import { FormField } from '@/components/molecules/FormField';
import { TextInput } from '@/components/primitives/TextInput';
import { useState } from 'react';

export type SettingsScreen =
  | 'main'
  | 'notification'
  | 'pushToggle'
  | 'marketingToggle'
  | 'photoPermission'
  | 'locationPermission'
  | 'cameraPermission'
  | 'theme'
  | 'lightMode'
  | 'darkMode'
  | 'systemMode'
  | 'language'
  | 'terms'
  | 'privacy'
  | 'openSourceLicense'
  | 'appVersion'
  | 'customerSupport'
  | 'inquiryForm'
  | 'inquiryComplete';

export interface SettingsProps {
  screen?: SettingsScreen;
  onBack?: () => void;
  onNavigate?: (screen: SettingsScreen) => void;
  onHiddenFriends?: () => void;
  onHiddenInvitations?: () => void;
  onAccount?: () => void;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

const ToggleItem = ({
  icon,
  label,
  defaultChecked,
}: {
  icon: IconName;
  label: string;
  defaultChecked?: boolean;
}) => (
  <MenuItem
    leftIcon={icon}
    rightSlot={<Switch defaultChecked={defaultChecked} />}
  >
    {label}
  </MenuItem>
);

export const Settings = ({ screen = 'main', onBack, onNavigate, onHiddenFriends, onHiddenInvitations, onAccount }: SettingsProps) => {
  const [inquiryDone, setInquiryDone] = useState(screen === 'inquiryComplete');

  if (screen === 'main') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar
          className="shrink-0"
          title="설정"
          onBack={onBack}
          variant="solid"
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Section title="알림">
            <MenuItem
              leftIcon="bell"
              onClick={() => onNavigate?.('notification')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              알림 설정
            </MenuItem>
          </Section>
          <Section title="권한">
            <MenuItem
              leftIcon="image"
              onClick={() => onNavigate?.('photoPermission')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              사진
            </MenuItem>
            <MenuItem
              leftIcon="map-pin"
              onClick={() => onNavigate?.('locationPermission')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              위치
            </MenuItem>
            <MenuItem
              leftIcon="camera"
              onClick={() => onNavigate?.('cameraPermission')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              카메라
            </MenuItem>
          </Section>
          <Section title="앱">
            <MenuItem
              leftIcon="palette"
              onClick={() => onNavigate?.('theme')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              테마
            </MenuItem>
            <MenuItem
              leftIcon="globe"
              onClick={() => onNavigate?.('language')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              언어
            </MenuItem>
          </Section>
          <Section title="약관 / 정책">
            <MenuItem
              leftIcon="file-text"
              onClick={() => onNavigate?.('terms')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              이용약관
            </MenuItem>
            <MenuItem
              leftIcon="shield-check"
              onClick={() => onNavigate?.('privacy')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              개인정보처리방침
            </MenuItem>
            <MenuItem
              leftIcon="file-text"
              onClick={() => onNavigate?.('openSourceLicense')}
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              오픈소스 라이선스
            </MenuItem>
            <MenuItem
              leftIcon="info"
              onClick={() => onNavigate?.('appVersion')}
              rightSlot={
                <span className="text-[13px] text-text-tertiary">v0.1.0</span>
              }
            >
              앱 버전
            </MenuItem>
          </Section>
          <Section title="계정">
            <MenuItem
              leftIcon="user-x"
              onClick={onHiddenFriends}
              rightSlot={
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              }
            >
              삭제한 친구
            </MenuItem>
            <MenuItem
              leftIcon="eye-off"
              onClick={onHiddenInvitations}
              rightSlot={
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              }
            >
              숨긴 초대장
            </MenuItem>
            <MenuItem
              leftIcon="user-round-cog"
              onClick={onAccount}
              rightSlot={
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              }
            >
              계정 관리
            </MenuItem>
          </Section>
          <Section title="지원">
            <MenuItem
              leftIcon="help-circle"
              onClick={() => onNavigate?.('customerSupport')}
              rightSlot={
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              }
            >
              고객센터
            </MenuItem>
          </Section>
          <div className="h-6" />
        </main>
      </div>
    );
  }

  if (
    screen === 'notification' ||
    screen === 'pushToggle' ||
    screen === 'marketingToggle'
  ) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="알림 설정" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Section title="기본 알림">
            <ToggleItem
              icon="bell"
              label="푸시 알림"
              defaultChecked={screen === 'pushToggle'}
            />
            <ToggleItem icon="bell" label="새 RSVP" defaultChecked />
            <ToggleItem icon="message-circle" label="새 댓글" defaultChecked />
            <ToggleItem icon="image" label="새 사진" defaultChecked />
            <ToggleItem
              icon="calendar-clock"
              label="모임 리마인더"
              defaultChecked
            />
          </Section>
          <Section title="마케팅">
            <ToggleItem
              icon="megaphone"
              label="이벤트·소식"
              defaultChecked={screen === 'marketingToggle'}
            />
          </Section>
        </main>
      </div>
    );
  }

  if (
    screen === 'photoPermission' ||
    screen === 'locationPermission' ||
    screen === 'cameraPermission'
  ) {
    const map = {
      photoPermission: {
        title: '사진 접근',
        description: '갤러리에서 사진을 선택해 앨범에 올릴 수 있어요',
      },
      locationPermission: {
        title: '위치',
        description: '초대장 장소를 지도로 보여드려요',
      },
      cameraPermission: {
        title: '카메라',
        description: '사진을 직접 촬영해 올릴 수 있어요',
      },
    } as const;
    const { title, description } = map[screen];
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={title} onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-6">
          <p className="text-[14px] text-text-secondary">{description}</p>
        </main>
        <footer className="px-page py-5">
          <Button variant="outline" fullWidth>
            시스템 설정 열기
          </Button>
        </footer>
      </div>
    );
  }

  if (
    screen === 'theme' ||
    screen === 'lightMode' ||
    screen === 'darkMode' ||
    screen === 'systemMode'
  ) {
    const value =
      screen === 'lightMode'
        ? 'light'
        : screen === 'darkMode'
          ? 'dark'
          : 'system';
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="테마" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-page py-4">
          <RadioGroup defaultValue={value}>
            {[
              { value: 'light', label: '라이트 모드' },
              { value: 'dark', label: '다크 모드 (V1.1+)' },
              { value: 'system', label: '시스템 설정 따르기' },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 rounded-md border border-border bg-surface p-4"
              >
                <Radio value={opt.value} />
                <span className="text-[15px] text-text-primary">
                  {opt.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        </main>
      </div>
    );
  }

  if (screen === 'language') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="언어" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-page py-4">
          <RadioGroup defaultValue="ko">
            {[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English (V1.1+)' },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 rounded-md border border-border bg-surface p-4"
              >
                <Radio value={opt.value} />
                <span className="text-[15px] text-text-primary">
                  {opt.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        </main>
      </div>
    );
  }

  if (
    screen === 'terms' ||
    screen === 'privacy' ||
    screen === 'openSourceLicense'
  ) {
    const title =
      screen === 'terms'
        ? '이용약관'
        : screen === 'privacy'
          ? '개인정보처리방침'
          : '오픈소스 라이선스';
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={title} onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-page py-6 text-[13px] leading-relaxed text-text-secondary">
          (본문 발췌) 본 약관은 …
        </main>
      </div>
    );
  }

  if (screen === 'appVersion') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="앱 버전" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto">
          <Icon name="send" size="xl" color="primary" decorative />
          <p className="text-[18px] font-bold text-text-primary">Wara v0.1.0</p>
          <p className="text-[13px] text-text-tertiary">최신 버전이에요</p>
        </main>
      </div>
    );
  }

  if (screen === 'customerSupport') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="고객센터" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Section title="자주 묻는 질문">
            <MenuItem
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              RSVP가 안 보여요
            </MenuItem>
            <MenuItem
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              초대 링크가 만료됐어요
            </MenuItem>
            <MenuItem
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              탈퇴는 어떻게 하나요?
            </MenuItem>
          </Section>
          <Section title="문의">
            <MenuItem
              leftIcon="mail"
              rightSlot={
                <Icon
                  name="chevron-right"
                  size="sm"
                  color="inactive"
                  decorative
                />
              }
            >
              문의 보내기
            </MenuItem>
          </Section>
        </main>
      </div>
    );
  }

  // inquiryForm / inquiryComplete
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="문의하기" onBack={onBack} />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page py-6">
        <FormField label="이메일" required>
          <TextInput placeholder="reply@example.com" />
        </FormField>
        <FormField
          label="문의 내용"
          required
          // counter={{ current: 0, max: 1000 }}
        >
          <Textarea rows={6} placeholder="문의하고 싶은 내용을 입력해주세요." />
        </FormField>
      </main>
      <footer className="px-page pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setInquiryDone(true)}
        >
          보내기
        </Button>
      </footer>
      <ConfirmModal
        contained
        open={inquiryDone}
        onOpenChange={setInquiryDone}
        title="문의가 접수됐어요"
        description="빠른 시일 내 답변드릴게요"
        confirmLabel="확인"
        onConfirm={() => setInquiryDone(false)}
      />
      <Divider />
    </div>
  );
};

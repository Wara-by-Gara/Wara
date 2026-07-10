// 설정 허브 — grouped 리스트로 지원(고객센터/약관)·알림·계정 항목을 묶는다.
// 존재하는 화면으로만 링크하고, 미구현 항목은 '준비 중'으로 비활성 표시한다.

import { useRouter } from 'expo-router';

import { ListRow, ListRowLink, ListSection, Screen } from '@/components/ios';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen scroll background="grouped">
      <ListSection header="지원">
        <ListRowLink
          title="고객센터"
          subtitle="문의하기 · 자주 묻는 질문"
          icon="questionmark.circle.fill"
          href="/support"
        />
        <ListRowLink title="약관 및 정책" icon="doc.text.fill" href="/settings/terms" />
      </ListSection>

      <ListSection header="숨김 관리">
        <ListRowLink title="숨긴 초대장" icon="eye.slash.fill" href="/invitations/hidden" />
        <ListRowLink title="삭제한 친구" icon="person.crop.circle.badge.xmark" href="/friends/hidden" />
      </ListSection>

      <ListSection header="알림" footer="알림 설정은 준비 중이에요.">
        <ListRow title="알림 설정" icon="bell.fill" value="준비 중" accessory="none" />
      </ListSection>

      <ListSection header="계정" footer="프로필 편집·소셜 연결·로그아웃·탈퇴는 마이페이지에서 관리해요.">
        <ListRow
          title="계정 관리"
          icon="person.crop.circle.fill"
          accessory="chevron"
          onPress={() => router.push('/profile')}
        />
      </ListSection>
    </Screen>
  );
}

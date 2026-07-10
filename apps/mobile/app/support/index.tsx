// 고객센터 허브 — FAQ와 문의하기 진입.

import { ListRowLink, ListSection, Screen } from '@/components/ios';

export default function SupportScreen() {
  return (
    <Screen scroll background="grouped">
      <ListSection footer="궁금한 점은 FAQ에서 먼저 찾아보고, 해결되지 않으면 문의를 남겨주세요.">
        <ListRowLink
          title="자주 묻는 질문"
          subtitle="FAQ에서 빠르게 찾기"
          icon="questionmark.circle.fill"
          href="/support/faq"
        />
        <ListRowLink
          title="내 문의"
          subtitle="문의 남기기 · 답변 확인"
          icon="bubble.left.and.bubble.right.fill"
          href="/support/inquiries"
        />
      </ListSection>
    </Screen>
  );
}

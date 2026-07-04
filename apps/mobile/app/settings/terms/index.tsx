// 약관·정책 목록 — 웹 /terms/service·privacy·location 개별 페이지 미러.
// 항목 선택 시 /settings/terms/[type] 전문 화면으로 이동.

import { ListRowLink, ListSection, Screen } from '@/components/ios';
import { TERM_DETAIL_TITLE, TERM_DETAIL_TYPES } from '@/constants/terms';

export default function TermsScreen() {
  return (
    <Screen scroll background="grouped">
      <ListSection>
        {TERM_DETAIL_TYPES.map((type) => (
          <ListRowLink key={type} title={TERM_DETAIL_TITLE[type]} href={`/settings/terms/${type}`} />
        ))}
      </ListSection>
    </Screen>
  );
}

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  CommentBox,
  MonthCalendar,
  DateTimeSelector,
  GalleryGrid,
  NotificationItem,
  WeatherCard,
  LocationWeatherInline,
  KakaoMap,
  InvitationInfoCard,
  ParticipantSummaryCard,
  ParticipantProfileModal,
  dateKey,
  type DateTimeValue,
  type GalleryPhoto,
  type NotificationType,
} from "@/components/domain";
import { dsWrap } from "./_dsDecorator";

const meta: Meta = {
  title: "Domain/Content",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Comment: Story = {
  name: "CommentBox",
  render: function Render() {
    const [log, setLog] = useState<string[]>([]);
    return (
      <div style={{ maxWidth: 420 }}>
        <p className="type-caption" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
          Enter 작성 · Shift+Enter 줄바꿈 · Esc 비우기
        </p>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
          <CommentBox
            avatarName="김민지"
            onSubmit={(t) => setLog((l) => [...l, t])}
            onAddGif={() => {}}
            onAddPhoto={() => {}}
            onAddMention={() => {}}
          />
        </div>
        {log.map((t, i) => (
          <p key={i} className="type-bodySmall" style={{ color: "var(--text-muted)" }}>· {t}</p>
        ))}
      </div>
    );
  },
};

export const Calendar: Story = {
  name: "MonthCalendar",
  render: function Render() {
    const now = new Date();
    const [sel, setSel] = useState<Set<string>>(new Set([dateKey(now.getFullYear(), now.getMonth() + 1, 15)]));
    const [m, setM] = useState(now.getMonth() + 1);
    const [y, setY] = useState(now.getFullYear());
    const prev = () => (m === 1 ? (setY(y - 1), setM(12)) : setM(m - 1));
    const next = () => (m === 12 ? (setY(y + 1), setM(1)) : setM(m + 1));
    return (
      <div style={{ maxWidth: 380 }}>
        <MonthCalendar
          year={y}
          month={m}
          selectedKeys={sel}
          onDayClick={(k) => setSel((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
          onPrevMonth={prev}
          onNextMonth={next}
        />
      </div>
    );
  },
};

export const DateTime: Story = {
  name: "DateTimeSelector",
  render: function Render() {
    const [v, setV] = useState<DateTimeValue>({ time: "19:00" });
    return (
      <div style={{ maxWidth: 380 }}>
        <DateTimeSelector value={v} onChange={setV} />
      </div>
    );
  },
};

const PHOTOS: GalleryPhoto[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  url: `https://picsum.photos/seed/wara${i}/300/300`,
  alt: `사진 ${i + 1}`,
}));

export const Gallery: Story = {
  name: "GalleryGrid",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <GalleryGrid photos={PHOTOS} maxVisible={6} onSelect={() => {}} />
    </div>
  ),
};

const NOTIS: { type: NotificationType; title: string; description?: string; time: string; unread?: boolean }[] = [
  { type: "newRsvp", title: "이서연님이 참석으로 응답했어요", time: "3분 전", unread: true },
  { type: "newComment", title: "박도윤님이 댓글을 남겼어요", description: "기대돼요!", time: "1시간 전", unread: true },
  { type: "eventReminder", title: "내일 와라 송년 파티가 있어요", time: "어제" },
  { type: "hostNotice", title: "호스트 공지가 등록되었어요", description: "드레스코드 안내", time: "2일 전" },
];

export const Notifications: Story = {
  name: "NotificationItem",
  render: () => (
    <div style={{ maxWidth: 420, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {NOTIS.map((n, i) => (
        <NotificationItem key={i} {...n} onDelete={() => {}} onClick={() => {}} />
      ))}
    </div>
  ),
};

export const Weather: Story = {
  name: "WeatherCard",
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
      <WeatherCard condition="partlyCloudy" temperatureCelsius={7} rainProbability={20} tip="쌀쌀해요. 겉옷을 챙기세요 🧥" />
      <WeatherCard unavailable />
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
        <span className="type-bodySmall text-text-muted">위치 카드 인라인 →</span>
        <LocationWeatherInline condition="rainy" temperatureCelsius={12} />
      </div>
    </div>
  ),
};

export const InfoCards: Story = {
  name: "InvitationInfoCard",
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 10 }}>
      <InvitationInfoCard
        variant="datetime"
        title="12월 24일 (화)"
        time="오후 7시"
        description="약 3시간 예상"
      />
      <InvitationInfoCard variant="location" title="성수동 라운지" description="서울 성동구 성수이로 123" chevron />
      <InvitationInfoCard variant="host" title="김민지" />
      <InvitationInfoCard variant="rsvp" title="참석 12명" chevron />
    </div>
  ),
};

const SUMMARY = { total: 18, attending: 12, maybe: 4, declined: 2, noResponse: 3, capacity: 20 };

export const SummaryCard: Story = {
  name: "ParticipantSummaryCard",
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 16 }}>
      <ParticipantSummaryCard summary={SUMMARY} />
      <ParticipantSummaryCard variant="host" summary={SUMMARY} />
    </div>
  ),
};

export const ProfileModal: Story = {
  name: "ParticipantProfileModal",
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ maxWidth: 380 }}>
        <button className="type-button text-link" onClick={() => setOpen(true)}>
          모달 열기
        </button>
        <ParticipantProfileModal
          open={open}
          onOpenChange={setOpen}
          userId="demo-user"
          name="이서연"
          handle="seoyeon"
          status="attending"
          isHost
          bio="성수동 근처에 살아요. 사진 찍는 거 좋아해요 📷"
          requestPreview="조금 늦을 수도 있어요!"
        />
      </div>
    );
  },
};

export const Map: Story = {
  name: "KakaoMap",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <KakaoMap placeName="성수동 라운지" address="서울 성동구 성수이로 123" onOpen={() => {}} />
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@wara/ui";
import {
  InviteCard,
  RSVPButtonGroup,
  ParticipantList,
  ProfileSummary,
  InvitationCover,
  TemplateCard,
  type RSVPValue,
  type Participant,
} from "@/components/domain";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Domain/Cards",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const AVATARS = [{ name: "김민지" }, { name: "이서연" }, { name: "박도윤" }];

const PARTICIPANTS: Participant[] = [
  { id: "1", name: "김민지", handle: "minji", status: "attending", isHost: true },
  { id: "2", name: "이서연", handle: "seoyeon", status: "attending", companionCount: 1 },
  { id: "3", name: "박도윤", status: "undecided", requestPreview: "조금 늦을 것 같아요!" },
  { id: "4", name: "최하준", status: "absent" },
  { id: "5", name: "정유나", status: "noResponse" },
];

export const Cards: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Section title="vertical">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InviteCard title="와라 송년 파티" dateText="12.24 (화) 19:00" locationText="성수동 라운지" badge={{ label: "D-3", tone: "info" }} rsvp={{ label: "참석", tone: "success" }} participants={AVATARS} participantTotal={8} />
          <InviteCard title="제주도 여행" dateText="1.10 (토)" locationText="제주" badge={{ label: "오늘", tone: "accent" }} />
        </div>
      </Section>
      <Section title="horizontal">
        <InviteCard layout="horizontal" title="동네 러닝 모임" dateText="매주 토요일 아침 7시" locationText="한강공원" badge={{ label: "호스팅", tone: "accent" }} participants={AVATARS} participantTotal={5} />
      </Section>
    </div>
  ),
};

// 글래스 원은 컬러 배경 위에서 보임 → 테마 그라데이션 위에 렌더
const THEME_BG =
  "radial-gradient(at 18% 28%, #f4a6c0 0%, transparent 52%), radial-gradient(at 82% 18%, #aee08f 0%, transparent 52%), radial-gradient(at 65% 88%, #f0b8d4 0%, transparent 52%), #d6e3b4";

export const Rsvp: Story = {
  name: "RSVPButtonGroup",
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [v, setV] = useState<RSVPValue>("attending");
    return (
      <div style={{ background: THEME_BG, padding: "40px 20px", minHeight: 520, fontFamily: "var(--font-sans)" }}>
        <p style={{ marginBottom: 16, color: "#3a2a33", fontSize: 13 }}>
          기본(미선택→선택 토글) · 선택 시 나머지 dim
        </p>
        <RSVPButtonGroup value={v} onValueChange={setV} helperText={`선택: ${v}`} />
        <div style={{ height: 28 }} />
        <p style={{ marginBottom: 16, color: "#3a2a33", fontSize: 13 }}>
          호스트 커스텀 이모지/라벨 (Hearts)
        </p>
        <RSVPButtonGroup
          value="attending"
          options={{
            attending: { emoji: "❤️", label: "갈래요" },
            undecided: { emoji: "❤️‍🩹", label: "글쎄요" },
            absent: { emoji: "💔", label: "못가요" },
          }}
        />
      </div>
    );
  },
};

export const Participants: Story = {
  name: "ParticipantList",
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <ParticipantList participants={PARTICIPANTS} onMore={() => {}} />
    </div>
  ),
};

const COVER_IMG = "https://picsum.photos/seed/waracover/600/750";

export const Cover: Story = {
  name: "InvitationCover",
  render: () => (
    <div style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
      <InvitationCover variant="image" imageUrl={COVER_IMG} ddayLabel="D-3" onShare={() => {}}>
        <h2 className="type-cardTitle text-text-inverse">와라 송년 파티</h2>
        <p className="type-bodySmall text-text-inverse/80">12.24 (화) 19:00 · 성수동 라운지</p>
      </InvitationCover>
      <InvitationCover variant="no-image" ddayLabel="TODAY" />
      <InvitationCover variant="color" backgroundClass="bg-primary-soft">
        <h2 className="type-cardTitle text-text">컬러 표지</h2>
      </InvitationCover>
    </div>
  ),
};

export const Templates: Story = {
  name: "TemplateCard",
  render: function Render() {
    const [sel, setSel] = useState("y2k");
    const items = [
      { id: "y2k", name: "Y2K Pop", category: "Y2K", img: "https://picsum.photos/seed/t1/300/400" },
      { id: "min", name: "Minimal", category: "Minimal", img: "https://picsum.photos/seed/t2/300/400" },
      { id: "prem", name: "Premium", img: "https://picsum.photos/seed/t3/300/400", locked: true },
    ];
    return (
      <div style={{ maxWidth: 420, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {items.map((t) => (
          <TemplateCard
            key={t.id}
            name={t.name}
            category={t.category}
            imageUrl={t.img}
            variant={t.locked ? "premium" : sel === t.id ? "selected" : "basic"}
            onClick={() => setSel(t.id)}
          />
        ))}
        <TemplateCard name="이미지 없음" variant="noImage" />
      </div>
    );
  },
};

export const Profile: Story = {
  name: "ProfileSummary",
  render: () => (
    <ProfileSummary
      name="김민지"
      handle="minji"
      bio="모임 만들기를 좋아하는 호스트 ✨"
      stats={[{ label: "모임", value: 12 }, { label: "친구", value: 48 }, { label: "사진", value: 230 }]}
      action={<Button size="sm">프로필 편집</Button>}
    />
  ),
};

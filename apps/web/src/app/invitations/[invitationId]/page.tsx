"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getInvitation, type Invitation } from "@/lib/api/invitations";
import { getMe, type Me } from "@/lib/api/users";
import {
  getParticipants,
  joinInvitation,
  updateRsvp,
  type Participant,
  type RsvpStatus,
} from "@/lib/api/participants";
import { ROUTES } from "@/constants/routes";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatEventDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const time = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function Avatar({ user }: { user: { nickname: string | null; profileImageUrl: string | null } }) {
  const initial = (user.nickname ?? "?")[0]!.toUpperCase();
  if (user.profileImageUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={user.profileImageUrl}
          alt={user.nickname ?? ""}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
        />
        <span className="text-xs text-[#505f78] truncate max-w-[52px]">{user.nickname ?? "익명"}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full bg-[#a73921]/10 border-2 border-white shadow flex items-center justify-center text-[#a73921] font-semibold text-base">
        {initial}
      </div>
      <span className="text-xs text-[#505f78] truncate max-w-[52px]">{user.nickname ?? "익명"}</span>
    </div>
  );
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "attending", label: "참석" },
  { value: "undecided", label: "미정" },
  { value: "absent", label: "불참" },
];

export default function InvitationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.invitationId as string;
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") ?? "" : "";

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const inv = await getInvitation(invitationId);
        setInvitation(inv);

        if (isLoggedIn && token) {
          const [currentUser, participantList] = await Promise.allSettled([
            getMe(token),
            getParticipants(invitationId, token),
          ]);
          const resolvedMe = currentUser.status === "fulfilled" ? currentUser.value : null;
          if (resolvedMe) setMe(resolvedMe);

          if (participantList.status === "fulfilled") {
            const list = participantList.value.participants.map((r) => r.participant);
            setParticipants(list);
            if (resolvedMe) {
              const mine = list.find((p) => p.userId === resolvedMe.id);
              setMyParticipant(mine ?? null);
            }
          }
        }
      } catch {
        setError("초대장을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hydrated, isLoggedIn, invitationId]);

  useEffect(() => {
    if (!me || participants.length === 0) return;
    const mine = participants.find((p) => p.userId === me.id);
    setMyParticipant(mine ?? null);
  }, [me, participants]);

  const isHost = invitation && me ? invitation.userId === me.id : false;

  const handleRsvp = async (status: RsvpStatus) => {
    const token = localStorage.getItem("access_token") ?? "";
    if (!token || !invitation) return;
    setRsvpLoading(true);
    try {
      if (!myParticipant) {
        const joined = await joinInvitation(invitationId, status, token);
        setMyParticipant(joined);
        setParticipants((prev) => [...prev, joined]);
      } else {
        if (myParticipant.rsvpStatus === status) return;
        const updated = await updateRsvp(invitationId, myParticipant.id, status, token);
        setMyParticipant(updated);
        setParticipants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch {
      // RSVP 엔드포인트 미구현 시 조용히 무시
    } finally {
      setRsvpLoading(false);
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center">
        <div className="text-[#505f78] text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex flex-col items-center justify-center gap-4">
        <p className="text-[#505f78]">{error ?? "초대장을 찾을 수 없습니다."}</p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
          className="text-sm text-[#a73921] underline"
        >
          새 초대장 만들기
        </button>
      </div>
    );
  }

  const { date: eventDate, time: eventTime } = invitation.eventStartAt
    ? formatEventDate(invitation.eventStartAt)
    : { date: null, time: null };

  const coverSrc = `${API_URL}/files/${invitation.mainImageKey}`;

  const attendingGuests = participants.filter(
    (p) => p.memberRole === "GUEST" && p.rsvpStatus === "attending"
  );

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#fbf9f8]/80 backdrop-blur-sm border-b border-[#e4e2e2]">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#505f78] hover:opacity-70 transition-opacity text-sm flex items-center gap-1"
          >
            ← 뒤로
          </button>
          <span className="font-serif text-[#a73921] text-2xl font-bold">WARA</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-0 sm:px-6 py-0 sm:py-8">
        <div className="bg-white sm:rounded-2xl sm:shadow-sm overflow-hidden">

          {/* 커버 이미지 */}
          <div className="relative aspect-[4/5] w-full bg-[#e4e2e2]">
            <img
              src={coverSrc}
              alt={invitation.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-white font-serif text-3xl font-bold leading-tight drop-shadow">
                {invitation.title}
              </h1>
              {eventDate && (
                <p className="text-white/80 text-sm mt-2 drop-shadow">
                  {eventDate}
                  {eventTime && ` · ${eventTime}`}
                </p>
              )}
            </div>
          </div>

          <div className="p-8 flex flex-col gap-8">

            {/* Host's Note */}
            {invitation.description.trim() && (
              <section>
                <p className="text-[11px] font-bold tracking-widest text-[#58423d] mb-3">
                  A MESSAGE FROM YOUR HOST
                </p>
                <p className="text-[#1b1c1c] text-base leading-relaxed whitespace-pre-wrap">
                  {invitation.description}
                </p>
              </section>
            )}

            {/* 날짜 & 시간 */}
            {eventDate && (
              <section>
                <p className="text-[11px] font-bold tracking-widest text-[#58423d] mb-3">
                  DATE & TIME
                </p>
                <div className="bg-[#f5f3f3] rounded-xl px-5 py-4">
                  <p className="text-[#1b1c1c] text-base font-medium">{eventDate}</p>
                  {eventTime && (
                    <p className="text-[#505f78] text-sm mt-1">{eventTime}</p>
                  )}
                </div>
              </section>
            )}

            {/* RSVP — 게스트만 표시 */}
            {isLoggedIn && !isHost && (
              <section>
                <p className="text-[11px] font-bold tracking-widest text-[#58423d] mb-3">
                  RSVP
                </p>
                <div className="flex gap-3">
                  {RSVP_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={rsvpLoading}
                      onClick={() => handleRsvp(value)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        myParticipant?.rsvpStatus === value
                          ? "bg-[#a73921] text-white border-[#a73921]"
                          : "bg-[#f5f3f3] text-[#1b1c1c] border-transparent hover:border-[#a73921]/30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 비로그인: 로그인 버튼 */}
            {!isLoggedIn && (
              <section>
                <p className="text-[11px] font-bold tracking-widest text-[#58423d] mb-3">
                  RSVP
                </p>
                <div className="bg-[#f5f3f3] rounded-xl px-5 py-5 flex flex-col items-center gap-4">
                  <p className="text-[#505f78] text-sm">참석 여부를 알리려면 로그인이 필요합니다.</p>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("wara_return_url", window.location.pathname);
                        window.location.href = `${API_URL}/auth/naver/redirect`;
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#03c75a] rounded-xl py-3 text-white font-semibold text-sm hover:bg-[#02b350] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" /></svg>
                      Continue with Naver
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("wara_return_url", window.location.pathname);
                        window.location.href = `${API_URL}/auth/kakao/redirect`;
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#fee500] rounded-xl py-3 text-[#191919] font-semibold text-sm hover:bg-[#f0d900] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.548 1.516 4.787 3.812 6.134l-.97 3.625 4.2-2.764A11.5 11.5 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" /></svg>
                      Continue with Kakao
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 참석자 목록 */}
            {attendingGuests.length > 0 && (
              <section>
                <p className="text-[11px] font-bold tracking-widest text-[#58423d] mb-3">
                  ATTENDING · {attendingGuests.length}
                </p>
                <div className="flex flex-wrap gap-4">
                  {attendingGuests.map((p) => (
                    <Avatar
                      key={p.id}
                      user={p.user ?? { nickname: null, profileImageUrl: null }}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-[#e4e2e2] mt-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="font-serif text-[#a73921] text-xl font-semibold">WARA</span>
          <span className="text-[#505f78] text-xs">© 2026 WARA. 요즘 모이는 방식.</span>
        </div>
      </footer>
    </div>
  );
}

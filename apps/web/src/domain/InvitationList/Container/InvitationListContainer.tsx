"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** 초대장 목록 UI는 홈 하단으로 이동 — 기존 경로는 홈(목록 섹션)으로 연결 */
export default function InvitationListContainer() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.HOME);
  }, [router]);

  return null;
}

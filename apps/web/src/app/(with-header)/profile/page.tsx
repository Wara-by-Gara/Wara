"use client";

import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { useAuthStore } from "@/stores/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
      <TopAppBar className="shrink-0" title="마이페이지" />
      <main className="flex flex-1 flex-col px-5 py-4">
        <div className="mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 text-[15px] text-text-tertiary"
          >
            로그아웃
          </button>
        </div>
      </main>
      <MainBottomNav activeKey="me" />
    </div>
  );
}

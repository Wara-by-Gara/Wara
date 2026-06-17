"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  // 다른 탭에서 로그아웃하면 이 탭도 동기화. reload하면 쿠키가 지워진 상태로 재-hydrate되어
  // 공개 페이지는 그대로, 보호 페이지는 각자의 가드로 로그인 유도된다.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "wara_logout" && e.newValue) {
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthHydrator />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

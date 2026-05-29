import { TopAppBar } from "@/components/molecules/TopAppBar";
import { EmptyState } from "@/components/organisms/EmptyState";

export default function CalendarPage() {
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0" title="캘린더" />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5">
        <EmptyState icon="calendar" title="캘린더" description="모임 일정을 한눈에 볼 수 있어요" />
      </main>
    </div>
  );
}

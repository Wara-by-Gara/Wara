import { TopAppBar } from "@/components/molecules/TopAppBar";
import { EmptyState } from "@/components/organisms/EmptyState";

export default function FriendsPage() {
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0" title="친구" />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5">
        <EmptyState icon="users" title="친구" description="함께 모임에 참여한 친구를 만나보세요" />
      </main>
    </div>
  );
}

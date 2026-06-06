import { LumaButton } from "./Button";

export interface LumaTimelineItem {
  title: string;
  content: React.ReactNode;
}

export function LumaTimeline({ items }: { items: LumaTimelineItem[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Timeline</h3>
        <LumaButton color="light" style="outline">설정</LumaButton>
      </div>
      <div className="space-y-6">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[7rem_1.5rem_1fr] gap-x-8">
            <p className="text-sm font-medium text-text-secondary">{item.title}</p>
            <div className="relative flex justify-center">
              <span className="size-2 rounded-full bg-brand" />
              {i < items.length - 1 ? (
                <span className="absolute top-2 h-full w-px bg-border" />
              ) : null}
            </div>
            <div className="text-sm text-text-primary">{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

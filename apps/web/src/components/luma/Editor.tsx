"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const TABS = ["JSON", "Code", "HTML", "Markdown"] as const;

export function LumaEditor({
  placeholder = "텍스트를 입력하세요",
  codeSample = '{\n  "name": "Wara",\n  "version": "1.0"\n}',
}: {
  placeholder?: string;
  codeSample?: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("JSON");
  const [text, setText] = useState("");

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[60px] w-full rounded-xs border border-gray-800 bg-background px-3 py-2 text-sm outline-none placeholder:text-white/30"
      />
      <div className="inline-flex rounded-xs bg-white/8 p-0.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xs px-3 py-1.5 text-sm transition-colors",
              tab === t ? "bg-white/12 font-semibold text-text-primary" : "text-text-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto rounded-xs bg-black/40 p-4 font-mono text-sm text-text-primary">
        {codeSample}
      </pre>
      <div className="flex gap-2">
        {["B", "I", "U"].map((btn) => (
          <button
            key={btn}
            type="button"
            className="flex size-8 items-center justify-center rounded text-text-tertiary hover:bg-white/8 hover:text-brand"
          >
            {btn}
          </button>
        ))}
      </div>
      <p className="rounded bg-brand/15 px-1 text-sm text-text-primary">
        선택된 텍스트 강조
      </p>
    </div>
  );
}

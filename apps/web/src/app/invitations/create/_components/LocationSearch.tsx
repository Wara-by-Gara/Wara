"use client";

import { useState, useRef, useEffect } from "react";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// 추후 API 연동 시 교체할 mock 결과
const MOCK_RESULTS = [
  "서울특별시 강남구 테헤란로 521",
  "서울특별시 마포구 홍익로 6길 20",
  "서울특별시 용산구 이태원로 200",
  "서울특별시 종로구 북촌로 5",
  "부산광역시 해운대구 해운대해변로 264",
];

export default function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
    if (v.length > 0) {
      setResults(MOCK_RESULTS.filter((r) => r.includes(v)));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const select = (r: string) => {
    setQuery(r);
    onChange(r);
    setOpen(false);
  };

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="장소명 또는 주소 검색"
          className="w-full bg-[#f5f3f3] text-[#1b1c1c] text-base pl-10 pr-4 py-3 rounded-lg outline-none placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#a73921]/30"
        />
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e4e2e2] overflow-hidden">
            {results.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => select(r)}
                className="w-full text-left px-4 py-3 text-sm text-[#1b1c1c] hover:bg-[#f5f3f3] flex items-center gap-2 cursor-pointer"
              >
                <PinIcon />
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 미리보기 placeholder */}
      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#e8e6e3]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#505f78]">
          <MapIcon />
          <span className="text-xs">지도 미리보기</span>
        </div>
        {value && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <PinIcon />
            <span className="text-xs text-[#1b1c1c] truncate">{value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a73921" strokeWidth="1.5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const MapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

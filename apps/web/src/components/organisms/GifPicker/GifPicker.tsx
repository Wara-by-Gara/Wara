"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GifGridSkeleton } from "@/components/organisms/Skeleton";
import { type KlipyGif, type KlipySearchResponse } from "@/lib/klipy";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

async function fetchGifs(query: string, page: number): Promise<KlipySearchResponse> {
  const endpoint = query.trim()
    ? `/api/gifs/search?q=${encodeURIComponent(query.trim())}&page=${page}`
    : `/api/gifs/trending?page=${page}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("gif_fetch_failed");
  return res.json();
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<KlipyGif[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuery = useRef(query);

  const load = async (q: string, p: number, append: boolean) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchGifs(q, p);
      setGifs((prev) => (append ? [...prev, ...data.gifs] : data.gifs));
      setHasNext(data.hasNext);
      setPage(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("", 1, false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      currentQuery.current = query;
      setGifs([]);
      load(query, 1, false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col h-[400px] bg-surface rounded-t-lg">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="GIF 검색..."
          className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-[14px] text-text placeholder:text-text-disabled outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-text-muted px-2 py-1"
        >
          닫기
        </button>
      </div>

      {/* GIF 그리드 */}
      <div className="flex-1 overflow-y-auto px-4">
        {error ? (
          <p className="text-center text-gray-400 py-10">불러오는 중 오류가 발생했습니다</p>
        ) : loading && gifs.length === 0 ? (
          <GifGridSkeleton count={6} />
        ) : gifs.length === 0 ? (
          <p className="text-center text-gray-400 py-10">검색 결과가 없습니다</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 pb-4">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelect(gif.gifUrl);
                    onClose();
                  }}
                  className="relative aspect-video rounded-sm overflow-hidden bg-gray-100"
                >
                  <Image
                    src={gif.previewUrl}
                    alt="GIF"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            {loading ? <GifGridSkeleton count={2} /> : null}
          </>
        )}

        {hasNext && !loading && (
          <button
            type="button"
            onClick={() => load(currentQuery.current, page + 1, true)}
            className="w-full text-sm text-text-muted py-3"
          >
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}

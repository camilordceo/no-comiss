"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PropiedadMedia } from "@/lib/types/database";
import { titleCase } from "@/lib/utils/format";

interface Photo {
  id: string;
  url: string;
  alt?: string;
  roomTag?: string | null;
}

interface Props {
  photos: PropiedadMedia[];
}

export function PhotoLightbox({ photos }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const startX = useRef<number | null>(null);

  const items: Photo[] = photos
    .filter((p) => p.public_url)
    .map((p) => ({
      id: p.id,
      url: p.public_url as string,
      roomTag: p.room_tag,
      alt: p.caption ?? undefined,
    }));

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((cur) => (cur == null ? cur : (cur + 1) % items.length)),
    [items.length],
  );
  const prev = useCallback(
    () =>
      setIndex((cur) =>
        cur == null ? cur : (cur - 1 + items.length) % items.length,
      ),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, next, prev]);

  // Preload neighbors for snappier nav.
  useEffect(() => {
    if (index === null) return;
    const neighbors = [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]];
    neighbors.forEach((n) => {
      if (!n) return;
      const img = new Image();
      img.src = n.url;
    });
  }, [index, items]);

  if (items.length === 0) return null;

  const active = index !== null ? items[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {items.map((p, i) => (
          <li key={p.id} className="relative">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-crema-2"
              aria-label={`Open photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                loading={i < 4 ? "eager" : "lazy"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {p.roomTag ? (
                <span className="absolute bottom-2 left-2 rounded-sm bg-espresso/80 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text-on-dark backdrop-blur-sm">
                  {titleCase(p.roomTag)}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-espresso/95 backdrop-blur-sm"
          onClick={close}
          onTouchStart={(e) => {
            startX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (startX.current == null) return;
            const endX = e.changedTouches[0]?.clientX ?? startX.current;
            const dx = endX - startX.current;
            startX.current = null;
            if (dx < -40) next();
            else if (dx > 40) prev();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-ivory/10 text-text-on-dark transition-colors hover:bg-ivory/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-sm bg-ivory/10 text-text-on-dark transition-colors hover:bg-ivory/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-sm bg-ivory/10 text-text-on-dark transition-colors hover:bg-ivory/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </>
          ) : null}

          <figure
            className="relative max-h-[88vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.alt ?? ""}
              className="max-h-[88vh] max-w-[92vw] object-contain"
            />
            <figcaption className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-on-dark/80">
              <span>{active.roomTag ? titleCase(active.roomTag) : ""}</span>
              <span>
                {(index ?? 0) + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}

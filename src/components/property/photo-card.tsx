"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2, Tag } from "lucide-react";
import type { PropiedadMedia } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { titleCase } from "@/lib/utils/format";

interface PhotoCardProps {
  media: PropiedadMedia;
  selected?: boolean;
  onClick?: (m: PropiedadMedia) => void;
  onDelete?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function PhotoCard({
  media,
  selected,
  onClick,
  onDelete,
  onToggleSelect,
  selectionMode,
}: PhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border bg-brand-medium-gray",
        isDragging
          ? "border-brand-teal opacity-60 ring-2 ring-brand-teal"
          : "border-brand-light-gray",
        selected && "ring-2 ring-brand-teal",
      )}
    >
      {media.public_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.public_url}
          alt={media.caption ?? ""}
          className="h-full w-full cursor-pointer object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          onClick={() => (selectionMode ? onToggleSelect?.(media.id) : onClick?.(media))}
        />
      ) : null}

      {selectionMode ? (
        <button
          type="button"
          aria-label={selected ? "Deselect photo" : "Select photo"}
          onClick={() => onToggleSelect?.(media.id)}
          className={cn(
            "absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-medium",
            selected ? "border-brand-teal bg-brand-teal text-white" : "border-brand-light-gray",
          )}
        >
          {selected ? "✓" : ""}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/90 text-brand-muted opacity-0 shadow-sm transition-opacity active:cursor-grabbing group-hover:opacity-100 focus:opacity-100"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {media.is_hero ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-teal px-2 py-0.5 text-[10px] font-medium text-white">
          <Star className="h-3 w-3" /> Hero
        </span>
      ) : null}

      {media.room_tag ? (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-brand-black shadow-sm">
          <Tag className="h-3 w-3 text-brand-teal" /> {titleCase(media.room_tag)}
        </span>
      ) : null}

      {!selectionMode && onDelete ? (
        <button
          type="button"
          aria-label="Delete photo"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(media.id);
          }}
          className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-error opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}

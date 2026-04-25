"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

import { PhotoCard } from "./photo-card";
import { PhotoDetailDialog } from "./photo-detail-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TAGS } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import type { PropiedadMedia } from "@/lib/types/database";

interface PhotoGridSortableProps {
  propertyId: string;
  initialPhotos: PropiedadMedia[];
}

export function PhotoGridSortable({ propertyId, initialPhotos }: PhotoGridSortableProps) {
  const [photos, setPhotos] = useState<PropiedadMedia[]>(initialPhotos);
  const [active, setActive] = useState<PropiedadMedia | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    if (filter === "all") return photos;
    if (filter === "untagged") return photos.filter((p) => !p.room_tag);
    return photos.filter((p) => p.room_tag === filter);
  }, [filter, photos]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === a.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);
    try {
      const res = await fetch("/api/media/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propiedad_id: propertyId, order: reordered.map((m) => m.id) }),
      });
      if (!res.ok) {
        toast.error("Couldn't save order");
        setPhotos(photos);
      }
    } catch (err) {
      logger.error("photo_grid.reorder_exception", { error: err });
      setPhotos(photos);
    }
  }

  function handleUpdated(updated: PropiedadMedia) {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === updated.id) return updated;
        if (updated.is_hero && p.id !== updated.id) return { ...p, is_hero: false };
        return p;
      }),
    );
  }

  function handleDeleted(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleDeleteFromCard(id: string) {
    if (!confirm("Delete this photo?")) return;
    const previous = photos;
    handleDeleted(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPhotos(previous);
        toast.error("Couldn't delete photo");
      }
    } catch (err) {
      logger.error("photo_grid.delete_exception", { error: err });
      setPhotos(previous);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} photo${selectedIds.size === 1 ? "" : "s"}?`)) return;
    const ids = Array.from(selectedIds);
    const previous = photos;
    setPhotos((p) => p.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    try {
      await Promise.all(ids.map((id) => fetch(`/api/media/${id}`, { method: "DELETE" })));
      toast.success(`${ids.length} deleted`);
    } catch (err) {
      logger.error("photo_grid.bulk_delete_exception", { error: err });
      setPhotos(previous);
      toast.error("Some deletes failed.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All photos</SelectItem>
              <SelectItem value="untagged">Untagged</SelectItem>
              {ROOM_TAGS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-brand-muted">
            {filtered.length} of {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectionMode ? (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
              >
                Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode(true)}
              disabled={photos.length === 0}
            >
              Select
            </Button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-light-gray bg-brand-bg-alt p-12 text-center text-sm text-brand-muted">
          No photos yet. Upload some above.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filtered.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((m) => (
                <PhotoCard
                  key={m.id}
                  media={m}
                  selected={selectedIds.has(m.id)}
                  selectionMode={selectionMode}
                  onClick={(media) => setActive(media)}
                  onDelete={handleDeleteFromCard}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <PhotoDetailDialog
        media={active}
        onOpenChange={(open) => !open && setActive(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

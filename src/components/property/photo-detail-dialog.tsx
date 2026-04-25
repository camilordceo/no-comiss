"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface PhotoDetailDialogProps {
  media: PropiedadMedia | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (m: PropiedadMedia) => void;
  onDeleted: (id: string) => void;
}

export function PhotoDetailDialog({
  media,
  onOpenChange,
  onUpdated,
  onDeleted,
}: PhotoDetailDialogProps) {
  const [caption, setCaption] = useState(media?.caption ?? "");
  const [roomTag, setRoomTag] = useState(media?.room_tag ?? "none");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCaption(media?.caption ?? "");
    setRoomTag(media?.room_tag ?? "none");
  }, [media]);

  async function patch(body: Record<string, unknown>) {
    if (!media) return null;
    const res = await fetch(`/api/media/${media.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      logger.warn("media.patch_failed", { status: res.status, data });
      toast.error("Couldn't update photo");
      return null;
    }
    return data.media as PropiedadMedia;
  }

  async function handleSave() {
    if (!media) return;
    setSaving(true);
    const updated = await patch({
      caption: caption.trim() || null,
      room_tag: roomTag === "none" ? null : roomTag,
    });
    if (updated) {
      onUpdated(updated);
      toast.success("Saved");
      onOpenChange(false);
    }
    setSaving(false);
  }

  async function handleSetHero() {
    if (!media) return;
    const updated = await patch({ is_hero: true });
    if (updated) {
      onUpdated(updated);
      toast.success("Hero photo updated");
    }
  }

  async function handleDelete() {
    if (!media) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${media.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete photo");
        return;
      }
      onDeleted(media.id);
      toast.success("Deleted");
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={!!media} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit photo</DialogTitle>
        </DialogHeader>

        {media ? (
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div className="overflow-hidden rounded-md border border-brand-light-gray bg-brand-medium-gray">
              {media.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.public_url} alt="" className="h-full w-full object-contain" />
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room_tag">Room</Label>
                <Select value={roomTag} onValueChange={setRoomTag}>
                  <SelectTrigger id="room_tag">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tag</SelectItem>
                    {ROOM_TAGS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={500}
                  placeholder="Add a note for buyers"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSetHero}
                  disabled={!!media.is_hero}
                >
                  <Star className="h-4 w-4" />
                  {media.is_hero ? "Hero photo" : "Set as hero"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-error hover:bg-error/10 hover:text-error"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete photo
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

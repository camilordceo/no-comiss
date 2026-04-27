"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";

interface Props {
  unreadCount: number;
  recent: Notification[];
}

export function NotificationBell({ unreadCount: initialUnread, recent: initialRecent }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [unread, setUnread] = useState(initialUnread);
  const [recent, setRecent] = useState<Notification[]>(initialRecent);
  const [open, setOpen] = useState(false);

  const markRead = async (idsOrAll: { ids?: string[]; all?: boolean }) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idsOrAll),
      });
      setRecent((prev) =>
        prev.map((n) => {
          if (idsOrAll.all) return { ...n, read: true };
          if (idsOrAll.ids?.includes(n.id)) return { ...n, read: true };
          return n;
        }),
      );
      setUnread((c) => {
        if (idsOrAll.all) return 0;
        const decrease = recent.filter(
          (n) => !n.read && idsOrAll.ids?.includes(n.id),
        ).length;
        return Math.max(0, c - decrease);
      });
      startTransition(() => router.refresh());
    } catch (err) {
      logger.warn("notifications.mark_read_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-sm border border-rule-strong bg-ivory text-text-2 transition-all duration-180 hover:border-espresso hover:text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso",
        )}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread > 0 ? (
          <span
            aria-label={`${unread} unread notifications`}
            className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral px-1 font-mono text-[10px] font-semibold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[340px] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Notifications
          </span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markRead({ all: true })}
              className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3 hover:text-coral"
            >
              <Check className="h-3 w-3" aria-hidden />
              Mark all read
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-3">
            No notifications yet.
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {recent.map((n) => (
              <li key={n.id} className="border-b border-rule last:border-b-0">
                <Link
                  href={n.action_url ?? "/dashboard"}
                  onClick={() => {
                    if (!n.read) markRead({ ids: [n.id] });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-crema-2",
                    !n.read && "bg-coral-tint/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans text-[13px] font-semibold leading-snug text-text">
                      {n.title}
                    </span>
                    {!n.read ? (
                      <span
                        aria-hidden
                        className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-coral"
                      />
                    ) : null}
                  </div>
                  {n.body ? (
                    <p className="line-clamp-2 text-xs text-text-2">{n.body}</p>
                  ) : null}
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                    {formatRelativeDate(n.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

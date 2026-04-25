"use client";

import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  values: T;
  enabled?: boolean;
  delay?: number;
  save: (values: T) => Promise<void>;
}

/**
 * Debounced auto-save. Watches `values` and triggers `save` after `delay` ms
 * of inactivity. Returns the current status so the UI can show a hint.
 */
export function useAutoSave<T>({ values, enabled = true, delay = 1000, save }: UseAutoSaveOptions<T>): AutoSaveStatus {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const initialValuesRef = useRef(values);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    if (initialValuesRef.current === values) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveRef.current(values);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, enabled, delay]);

  return status;
}

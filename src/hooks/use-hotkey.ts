"use client";

import { useEffect, useRef } from "react";

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return Boolean(t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)));
}

/**
 * Bind single-key shortcuts (e.g. "f", "?", "Enter"). Ignored while typing or
 * with modifier keys held. Keys typed inside a game iframe never reach us.
 */
export function useHotkey(keys: string | string[], handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const list = (Array.isArray(keys) ? keys : [keys]).map((k) => k.toLowerCase());
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      if (!list.includes(e.key.toLowerCase())) return;
      e.preventDefault();
      ref.current(e);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, Array.isArray(keys) ? keys.join("|") : keys]);
}

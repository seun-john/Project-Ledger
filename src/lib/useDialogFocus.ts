"use client";

import { useEffect, type RefObject } from "react";

/** Everything the browser will let a user Tab to, in DOM order. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(node: HTMLElement): HTMLElement[] {
  // offsetParent is null for display:none subtrees, which is what we want to
  // skip — a hidden control is still matched by the selector above.
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Makes an open dialog behave like one: focus moves into it, Tab cycles inside
 * it rather than wandering into the page behind the overlay, and the control
 * that opened it gets focus back on close.
 *
 * Without this the overlay is only a visual barrier — keyboard focus stays on
 * whatever was behind it, so a keyboard user tabs through a form they cannot
 * see. Pair with role="dialog", aria-modal, and tabIndex={-1} on the node.
 */
export function useDialogFocus<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Captured before we move focus, so we can hand it back on unmount.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const initial = focusableWithin(node)[0] ?? node;
    initial.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const items = focusableWithin(node);
      if (items.length === 0) {
        // Nothing to cycle through; keep focus pinned to the dialog itself.
        event.preventDefault();
        node.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      // The opener can be gone (deleted row, closed parent) — guard the call.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [ref]);
}

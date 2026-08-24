import { useRef, useState } from "react";
import type { PointerEvent } from "react";

export function useDragReorder<T>(items: T[], onReorder: (items: T[]) => void) {
  const rowRefs = useRef<Array<HTMLElement | null>>([]);
  const draggingFrom = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  function setRowRef(index: number) {
    return (el: HTMLElement | null) => {
      rowRefs.current[index] = el;
    };
  }

  function indexAtY(y: number): number {
    let closest = 0;
    let closestDist = Infinity;
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function handlePointerDown(index: number) {
    return (e: PointerEvent<HTMLElement>) => {
      e.preventDefault();
      draggingFrom.current = index;
      setDraggingIndex(index);
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function handlePointerMove(e: PointerEvent<HTMLElement>) {
    const from = draggingFrom.current;
    if (from === null) return;
    const to = indexAtY(e.clientY);
    if (to !== from) {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      draggingFrom.current = to;
      setDraggingIndex(to);
      onReorder(next);
    }
  }

  function handlePointerUp() {
    draggingFrom.current = null;
    setDraggingIndex(null);
  }

  return { setRowRef, draggingIndex, handlePointerDown, handlePointerMove, handlePointerUp };
}

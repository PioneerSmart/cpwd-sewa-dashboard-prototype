// Generic per-view widget layout: order + hidden set, persisted to localStorage.
// Lets a "Customize" mode on a dashboard reorder and show/hide its KPI tiles and
// chart cards — the "customizable widget layout" BI feature, applied view by view.

import { useCallback, useEffect, useState } from "react";

export type WidgetLayout = { order: string[]; hidden: string[] };

function storageKey(viewId: string) {
  return `pwd-platform-demo:widgets:${viewId}:v1`;
}

export function loadWidgetLayout(viewId: string, defaultOrder: string[]): WidgetLayout {
  if (typeof window === "undefined") return { order: defaultOrder, hidden: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(viewId));
    if (!raw) return { order: defaultOrder, hidden: [] };
    const parsed = JSON.parse(raw) as WidgetLayout;
    if (!parsed || !Array.isArray(parsed.order)) return { order: defaultOrder, hidden: [] };
    const known = new Set(parsed.order);
    const order = parsed.order.filter((id) => defaultOrder.includes(id));
    for (const id of defaultOrder) if (!known.has(id)) order.push(id);
    const hidden = (parsed.hidden ?? []).filter((id) => defaultOrder.includes(id));
    return { order, hidden };
  } catch {
    return { order: defaultOrder, hidden: [] };
  }
}

export function saveWidgetLayout(viewId: string, layout: WidgetLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(viewId), JSON.stringify(layout));
  } catch {
    // best-effort only
  }
}

export function useWidgetLayout(viewId: string, defaultOrder: string[]) {
  const [layout, setLayout] = useState<WidgetLayout>(() => loadWidgetLayout(viewId, defaultOrder));
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    saveWidgetLayout(viewId, layout);
  }, [viewId, layout]);

  const toggleHidden = useCallback((id: string) => {
    setLayout((l) => ({
      ...l,
      hidden: l.hidden.includes(id) ? l.hidden.filter((h) => h !== id) : [...l.hidden, id],
    }));
  }, []);

  /** Moves widget `draggedId` to just before `beforeId` in the order. */
  const reorderTo = useCallback((draggedId: string, beforeId: string) => {
    setLayout((l) => {
      if (draggedId === beforeId) return l;
      const order = l.order.filter((x) => x !== draggedId);
      const idx = order.indexOf(beforeId);
      if (idx === -1) return l;
      order.splice(idx, 0, draggedId);
      return { ...l, order };
    });
  }, []);

  const reset = useCallback(() => setLayout({ order: defaultOrder, hidden: [] }), [defaultOrder]);

  return {
    order: layout.order,
    hidden: layout.hidden,
    customizing,
    setCustomizing,
    toggleHidden,
    reorderTo,
    reset,
  };
}

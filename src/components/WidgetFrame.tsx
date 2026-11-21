"use client";

import { useState } from "react";

/**
 * Wraps a dashboard widget (KPI tile, chart card, table) so it can be reordered
 * and hidden in "Customize" mode. Outside customize mode it renders transparently
 * (no extra chrome) unless the widget is hidden, in which case it's skipped entirely.
 */
export function WidgetFrame({
  id,
  title,
  customizing,
  hidden,
  onToggleHidden,
  onReorder,
  children,
}: {
  id: string;
  title: string;
  customizing: boolean;
  hidden: boolean;
  onToggleHidden: () => void;
  onReorder: (draggedId: string) => void;
  children: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);

  if (hidden && !customizing) return null;
  if (!customizing) return <>{children}</>;

  return (
    <div
      className={"widget-frame" + (hidden ? " widget-frame-hidden" : "") + (dragOver ? " widget-frame-dragover" : "")}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/widget-id", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const draggedId = e.dataTransfer.getData("text/widget-id");
        if (draggedId && draggedId !== id) onReorder(draggedId);
      }}
    >
      <div className="widget-frame-bar">
        <span className="widget-drag-handle" title="Drag to reorder">⠿⠿</span>
        <span className="widget-frame-title">{title}</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onToggleHidden}>
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      <div className="widget-frame-body">
        {hidden ? <div className="empty-note">Hidden from this dashboard — click Show to bring it back.</div> : children}
      </div>
    </div>
  );
}

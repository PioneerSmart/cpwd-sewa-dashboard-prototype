"use client";

// Saved views / bookmarks: snapshots the whole app state (dashboard, geography
// filters, duration, simulated role, comparison selection) under a name the user
// picks, and restores it later with one click. Persisted via localStorage only.

import { useState } from "react";
import { Bookmark, loadBookmarks, saveBookmarks } from "@/lib/analytics";
import type { ViewId } from "./Shell";

export type BookmarkState = {
  view: ViewId;
  zoneId: string;
  circleId: string;
  divisionId: string;
  fromKey: number;
  toKey: number;
  roleId: string;
  compareSelection: string[];
};

export function BookmarksMenu({
  current,
  onRestore,
  onToast,
}: {
  current: BookmarkState;
  onRestore: (state: BookmarkState) => void;
  onToast: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Bookmark<BookmarkState>[]>(() => loadBookmarks<BookmarkState>());
  const [name, setName] = useState("");

  function persist(next: Bookmark<BookmarkState>[]) {
    setList(next);
    saveBookmarks(next);
  }

  function save() {
    const label =
      name.trim() ||
      `Saved view — ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
    const bm: Bookmark<BookmarkState> = {
      id: "bm-" + Math.random().toString(36).slice(2, 9),
      name: label,
      createdAt: Date.now(),
      state: current,
    };
    persist([bm, ...list]);
    setName("");
    onToast(`Saved view "${label}".`);
  }

  function remove(id: string, label: string) {
    persist(list.filter((b) => b.id !== id));
    onToast(`Removed saved view "${label}".`);
  }

  function restore(bm: Bookmark<BookmarkState>) {
    onRestore(bm.state);
    setOpen(false);
    onToast(`Restored saved view "${bm.name}".`);
  }

  return (
    <div className="bookmarks-wrap">
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setOpen((o) => !o)}
        title="Saved views & bookmarks"
      >
        ⭐ Views{list.length > 0 ? ` (${list.length})` : ""}
      </button>
      {open && (
        <>
          <div className="bookmarks-backdrop" onClick={() => setOpen(false)} />
          <div className="bookmarks-popover">
            <div className="bookmarks-save-row">
              <input
                className="text-input"
                placeholder="Name this view…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                }}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                Save current
              </button>
            </div>
            {list.length === 0 ? (
              <div className="empty-note" style={{ padding: "10px 4px" }}>
                No saved views yet. Save the current dashboard, filters, duration and simulated role to jump back to
                it instantly.
              </div>
            ) : (
              <ul className="bookmarks-list">
                {list.map((b) => (
                  <li key={b.id} className="bookmarks-item">
                    <button type="button" className="bookmarks-item-main" onClick={() => restore(b)}>
                      <span className="bookmarks-item-name">{b.name}</span>
                      <span className="hint">{new Date(b.createdAt).toLocaleDateString("en-IN")}</span>
                    </button>
                    <button
                      type="button"
                      className="bookmarks-del"
                      onClick={() => remove(b.id, b.name)}
                      aria-label="Delete saved view"
                      title="Delete saved view"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

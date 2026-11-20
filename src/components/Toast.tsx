"use client";
import { useEffect } from "react";

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

export function ExportButton({ what, onToast }: { what: string; onToast: (msg: string) => void }) {
  return (
    <button
      className="btn btn-sm"
      onClick={() =>
        onToast(`Export of ${what} as PDF / Excel is wired to the MIS report engine in production — disabled in this synthetic-data prototype.`)
      }
    >
      ⬇ Export
    </button>
  );
}

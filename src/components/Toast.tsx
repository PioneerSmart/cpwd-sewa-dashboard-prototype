"use client";
import { useEffect } from "react";
import { downloadCSV, toCSV } from "@/lib/analytics";

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

/** Real CSV export (opens directly in Excel / Google Sheets) for whatever table the calling view currently has on screen. */
export function ExportButton({
  filename,
  headers,
  rows,
  onToast,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  onToast: (msg: string) => void;
}) {
  return (
    <button
      className="btn btn-sm"
      onClick={() => {
        if (rows.length === 0) {
          onToast("Nothing to export yet — adjust the filters above first.");
          return;
        }
        downloadCSV(filename, toCSV(headers, rows));
        onToast(`Exported ${rows.length.toLocaleString("en-IN")} row${rows.length === 1 ? "" : "s"} as CSV.`);
      }}
    >
      ⬇ Export CSV
    </button>
  );
}

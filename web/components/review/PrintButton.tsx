"use client";

import { Download } from "lucide-react";

/** Uses the browser's "Save as PDF" with the print stylesheet. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button onClick={() => window.print()} className="btn-ghost no-print">
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}

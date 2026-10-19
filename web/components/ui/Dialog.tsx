"use client";

import { useEffect, useRef } from "react";

/** Accessible modal built on <dialog>. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {children && <div className="mt-3 space-y-2 text-[15px] leading-6 text-muted">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
      </div>
    </dialog>
  );
}

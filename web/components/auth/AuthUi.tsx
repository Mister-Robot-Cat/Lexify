"use client";

import { Loader2 } from "lucide-react";

export function AuthCard({ title, text, children }: { title: string; text?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card w-full max-w-md p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      {text && <p className="mt-2 text-muted">{text}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, id, ...rest } = props;
  const fieldId = id ?? rest.name;
  return (
    <div>
      <label htmlFor={fieldId} className="label">
        {label}
      </label>
      <input id={fieldId} className="input" {...rest} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormMessage({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: React.ReactNode }) {
  const styles = {
    error: "border-danger/30 bg-danger/5 text-danger",
    info: "border-amber/40 bg-amber-soft text-amber-deep",
    success: "border-success/30 bg-success/5 text-success",
  }[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}

export function SubmitButton({ busy, children, className = "btn-primary" }: { busy: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={busy} className={`${className} btn-lg w-full`}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

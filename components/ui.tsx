import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-jade-500/15 text-jade-700",
    completed: "bg-jade-500/15 text-jade-700",
    verified: "bg-jade-500/15 text-jade-700",
    approved: "bg-jade-500/15 text-jade-700",
    paid_off: "bg-jade-500/15 text-jade-700",
    resolved: "bg-jade-500/15 text-jade-700",
    pending: "bg-bronze-400/20 text-bronze-600",
    review: "bg-bronze-400/20 text-bronze-600",
    in_progress: "bg-sky-100 text-sky-800",
    open: "bg-sky-100 text-sky-800",
    frozen: "bg-orange-100 text-orange-700",
    blocked: "bg-orange-100 text-orange-700",
    flagged: "bg-orange-100 text-orange-700",
    failed: "bg-vermillion-500/15 text-vermillion-600",
    rejected: "bg-vermillion-500/15 text-vermillion-600",
    defaulted: "bg-vermillion-500/15 text-vermillion-600",
    cancelled: "bg-slate-200 text-slate-700",
    closed: "bg-slate-200 text-slate-700",
    expired: "bg-slate-200 text-slate-700",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    completed: "Completed",
    active: "Active",
    in_progress: "Processing",
    failed: "Declined",
    cancelled: "Cancelled",
    flagged: "Under Review",
    verified: "Verified",
    review: "Under Review",
    approved: "Approved",
    paid_off: "Paid Off",
    resolved: "Resolved",
    blocked: "Blocked",
    frozen: "Frozen",
  };
  return (
    <span className={cn("status-pill", map[status] || "bg-slate-100 text-slate-700")}>
      {labels[status] || status.replaceAll("_", " ")}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions, brandText }: { title: string; subtitle?: string; actions?: ReactNode; brandText?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-600">
          {brandText || "瑞峯 RuiFeng Private Bank"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-ink-600/80 md:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "jade" | "ink" | "vermillion" | "bronze" }) {
  const accents = {
    jade: "from-jade-500/12 to-transparent",
    ink: "from-ink-700/10 to-transparent",
    vermillion: "from-vermillion-500/10 to-transparent",
    bronze: "from-bronze-400/12 to-transparent",
  };
  return (
    <div className="card-shadow relative overflow-hidden rounded-2xl border border-ink-900/5 bg-white p-5">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accents[accent || "jade"])} />
      <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-ink-600/70">{label}</p>
      <p className="relative mt-3 font-display text-2xl font-semibold text-ink-900 md:text-3xl">{value}</p>
      {hint ? <p className="relative mt-2 text-xs text-ink-600/70">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, children, action, className }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn("card-shadow rounded-2xl border border-ink-900/5 bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/5 px-5 py-4">
          {title ? <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2> : <div />}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-600/80">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cn("input-field", className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return <select className={cn("input-field", className)} {...rest}>{children}</select>;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cn("input-field min-h-28", className)} {...rest} />;
}

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "dark" | "ghost" | "danger" }) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    dark: "btn-dark",
    ghost: "btn-ghost",
    danger: "inline-flex items-center justify-center gap-2 rounded-full bg-vermillion-500 px-4 py-2.5 font-semibold text-white hover:bg-vermillion-600",
  };
  return <button className={cn(variants[variant], "text-sm disabled:cursor-not-allowed disabled:opacity-60", className)} {...props} />;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-900/10 bg-rice-50 px-6 py-12 text-center">
      <p className="font-display text-lg text-ink-900">{title}</p>
      {description ? <p className="mt-2 text-sm text-ink-600/70">{description}</p> : null}
    </div>
  );
}

export function Alert({ type = "error", children }: { type?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-vermillion-500/30 bg-vermillion-500/5 text-vermillion-600",
    success: "border-jade-500/30 bg-jade-500/5 text-jade-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[type])}>{children}</div>;
}

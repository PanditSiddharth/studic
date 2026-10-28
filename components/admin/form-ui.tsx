"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/modals/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusStyles: Record<string, string> = {
  public: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  private: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  unlisted: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  archived: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  free: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paid: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const value = status || "draft";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
      statusStyles[value] ?? statusStyles.draft,
      className
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function FormPageHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  status?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          {status ? <StatusBadge status={status} /> : null}
        </div>
        <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <div className="max-w-2xl text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  footer,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
      <div className="flex items-start gap-3 border-b px-5 py-4 sm:px-6">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon size={16} strokeWidth={1.9} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className={cn("space-y-5 px-5 py-5 sm:px-6", contentClassName)}>{children}</div>
      {footer ? <div className="border-t bg-muted/20 px-5 py-3 sm:px-6">{footer}</div> : null}
    </section>
  );
}

export function FormActionsBar({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-4 z-20 mt-8 rounded-2xl border bg-background/95 p-3 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="px-1 text-xs text-muted-foreground">{hint}</div>
        <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}

export function StatusSelect({
  value,
  onChange,
  options,
  placeholder = "Select status…",
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

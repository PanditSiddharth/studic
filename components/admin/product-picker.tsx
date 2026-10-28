"use client";

import { useMemo, useState } from "react";
import { Check, Package, Search, X } from "lucide-react";
import type { ProductOption } from "@/server-functions/product";
import { cn } from "@/modals/utils";

interface ProductPickerProps {
  value?: string[];
  onChange: (ids: string[]) => void;
  options: ProductOption[];
  placeholder?: string;
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  published: "Live",
  archived: "Archived",
};

/** Searchable multi-select used to attach products to an article. */
export function ProductPicker({
  value = [],
  onChange,
  options,
  placeholder = "Search products…",
}: ProductPickerProps) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => value
      .map((id) => options.find((option) => option._id === id))
      .filter((option): option is ProductOption => Boolean(option)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.title} ${option.slug}`.toLowerCase().includes(needle)
    );
  }, [options, query]);

  const toggle = (id: string) => {
    if (selected.has(id)) onChange(value.filter((item) => item !== id));
    else onChange([...value, id]);
  };

  if (!options.length) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
        No products exist yet. Create one first, then link it here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option._id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              <span className="truncate">{option.title}</span>
              <button
                type="button"
                aria-label={`Remove ${option.title}`}
                onClick={() => onChange(value.filter((id) => id !== option._id))}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <Search size={14} className="shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-1.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No products match “{query.trim()}”.</p>
        ) : (
          filtered.map((option) => {
            const active = selected.has(option._id);
            return (
              <button
                key={option._id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(option._id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active ? "bg-primary/10 text-foreground" : "hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {active ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <Package size={14} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    /product/{option.slug}
                  </span>
                </span>
                {option.status && option.status !== "published" ? (
                  <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {statusLabel[option.status] || option.status}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {value.length} selected · only published products appear publicly
      </p>
    </div>
  );
}

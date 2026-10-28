"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/modals/utils";

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  addLabel?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag and press Enter",
  max = 30,
  className,
  addLabel = "Add",
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim().replace(/\s+/g, " ");
    if (!next) return;
    if (value.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, next]);
    setDraft("");
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !draft && value.length) {
      remove(value.length - 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => remove(index)}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length >= max ? `Maximum of ${max} reached` : placeholder}
          disabled={value.length >= max}
          maxLength={60}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          disabled={!draft.trim() || value.length >= max}
        >
          <Plus size={14} />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

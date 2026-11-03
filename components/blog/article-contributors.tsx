"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type ArticleContributor = { _id?: string; name?: string; username?: string; image?: string };

export function ContributorLine({ contributors }: { contributors?: ArticleContributor[] | null }) {
  const rows = (contributors || []).filter((item) => item?._id);
  if (!rows.length) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      Student contributions by
      {rows.slice(0, 4).map((item, index) => (
        <span key={item._id} className="inline-flex items-center gap-1.5">
          {index > 0 && <span>·</span>}
          <Avatar className="h-4 w-4">
            {item.image ? <AvatarImage src={item.image} alt={item.name || ""} /> : null}
            <AvatarFallback className="text-[8px]">{(item.name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{item.name || item.username}</span>
        </span>
      ))}
      {rows.length > 4 && <span>· +{rows.length - 4} more</span>}
    </span>
  );
}

export default function ArticleContributorsCard({ contributors }: { contributors?: ArticleContributor[] | null }) {
  const rows = (contributors || []).filter((item) => item?._id);
  if (!rows.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributors</h2>
      <div className="rounded-lg border bg-card p-3">
        <div className="space-y-2.5">
          {rows.map((item) => (
            <div key={item._id} className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                {item.image ? <AvatarImage src={item.image} alt={item.name || ""} /> : null}
                <AvatarFallback className="text-[10px]">{(item.name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{item.name || item.username}</p>
                {item.username && <p className="truncate text-[11px] text-muted-foreground">@{item.username}</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 border-t pt-2 text-[11px] leading-4 text-muted-foreground">
          Approved article edits by students.
        </p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen, Clock3, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ICourse } from "@/modals/course.model";
import { cn } from "@/modals/utils";
import { formatPrice } from "@/components/product/product-card";

const levelLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "all-levels": "All levels",
};

export default function CourseTile({ course, className }: { course: Partial<ICourse>; className?: string }) {
  const lessons = Array.isArray(course.content) ? course.content.length : 0;
  const isFree = course.accessType === "free" || !Number(course.price);
  const minutes = Number(course.estimatedMinutes || 0);
  const duration = minutes >= 60 ? `${Math.round(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : minutes ? `${minutes}m` : null;

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5", className)}>
      <Link href={`/course/${course.slug}`} className="relative block aspect-video overflow-hidden bg-muted">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title || "Course cover"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen size={28} /></div>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <PlayCircle size={12} /> View course
        </span>
        <span className={cn(
          "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur",
          isFree ? "bg-emerald-500/90 text-white" : "bg-background/90 text-foreground"
        )}>
          {isFree ? "Free" : formatPrice(course.price, course.currency)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {course.level && <span className="rounded-full border px-2 py-0.5">{levelLabel[course.level] || course.level}</span>}
          {lessons > 0 && <span className="inline-flex items-center gap-1"><BookOpen size={11} /> {lessons} lesson{lessons === 1 ? "" : "s"}</span>}
          {duration && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {duration}</span>}
        </div>

        <Link href={`/course/${course.slug}`} className="mt-2 focus:outline-none">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 group-hover:text-primary">{course.title}</h3>
        </Link>
        {course.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{course.description}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-sm font-semibold">{isFree ? <span className="text-emerald-600 dark:text-emerald-400">Free access</span> : formatPrice(course.price, course.currency)}</span>
          <Link href={`/course/${course.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            Open <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

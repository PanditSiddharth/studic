import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import CoursesBrowser from "@/components/course/courses-browser";
import { getCourses } from "@/server-functions/course";

const PAGE_SIZE = 9;

export const metadata = createPageMetadata({
  path: "/courses",
  title: "Courses",
  description: "Browse structured courses. Learn step by step and keep your progress in one library.",
});

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawSearch = resolvedSearchParams.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] || "" : rawSearch || "";
  const initialResult = await getCourses({
    skip: 0,
    postsPerPage: PAGE_SIZE,
    search: search.trim(),
  });
  if ("error" in initialResult) throw new Error(initialResult.error);

  return (
    <Suspense fallback={<div className="min-h-[60vh] w-full animate-pulse bg-muted/20" />}>
      <CoursesBrowser
        initialCourses={initialResult.courses ?? []}
        initialTotal={initialResult.totalCourses ?? 0}
        initialSearch={search.trim()}
      />
    </Suspense>
  );
}

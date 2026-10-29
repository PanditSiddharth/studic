import type { Metadata } from "next";
import { Suspense } from "react";
import CoursesBrowser from "@/components/course/courses-browser";

export const metadata: Metadata = {
  title: "Courses · Studic",
  description: "Browse structured courses. Learn step by step and keep your progress in one library.",
};

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] w-full animate-pulse bg-muted/20" />}>
      <CoursesBrowser />
    </Suspense>
  );
}

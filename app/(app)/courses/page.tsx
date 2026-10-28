import type { Metadata } from "next";
import CoursesBrowser from "@/components/course/courses-browser";

export const metadata: Metadata = {
  title: "Courses · Studic",
  description: "Browse structured courses. Learn step by step and keep your progress in one library.",
};

export default function CoursesPage() {
  return <CoursesBrowser />;
}

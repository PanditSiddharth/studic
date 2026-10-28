import CourseDetail from "@/components/course/course-detail";

export const metadata = { title: "Course · Studic" };

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CourseDetail slug={slug} />;
}

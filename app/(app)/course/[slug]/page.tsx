import type { Metadata } from "next";
import CourseDetail from "@/components/course/course-detail";
import JsonLd from "@/components/seo/json-ld";
import { getCourse } from "@/server-functions/course";
import { absoluteUrl, cleanMetaText } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCourse({ slug });
  if ("error" in result) return { title: "Course unavailable", robots: { index: false, follow: false } };
  const title = cleanMetaText(result.title, "Online course");
  return {
    title,
    description: cleanMetaText(result.description, `Learn ${title} with a practical course on Studic.`),
    alternates: { canonical: `/course/${slug}` },
    openGraph: { type: "website", title, description: cleanMetaText(result.description, title), url: absoluteUrl(`/course/${slug}`), images: result.thumbnail ? [{ url: result.thumbnail }] : undefined },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCourse({ slug });
  const course = "error" in result ? null : result;
  return (
    <>
      {course && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description,
          url: absoluteUrl(`/course/${slug}`),
          image: course.thumbnail || undefined,
          provider: { "@type": "Organization", name: "Studic", url: absoluteUrl("/") },
          offers: { "@type": "Offer", price: Number(course.price || 0), priceCurrency: course.currency || "INR", availability: "https://schema.org/InStock", url: absoluteUrl(`/course/${slug}`) },
        }} />
      )}
      <CourseDetail slug={slug} />
    </>
  );
}

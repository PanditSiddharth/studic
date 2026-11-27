import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import CourseLesson from "@/components/course/course-lesson";
import JsonLd from "@/components/seo/json-ld";
import { getCourseLesson } from "@/server-functions/course";
import { isHiddenBlogStatus } from "@/helpers";
import { absoluteUrl, breadcrumbSchema, cleanMetaText, createPageMetadata, isoDate, resolveCanonical } from "@/lib/seo";

type Props = { params: Promise<{ slug: string; blog: string }> };
type LessonResult = Exclude<Awaited<ReturnType<typeof getCourseLesson>>, { error: string }>;

const loadLesson = cache(async (courseSlug: string, lessonSlug: string): Promise<LessonResult> => {
  const result = await getCourseLesson({ courseSlug, lessonSlug });
  if ("error" in result) {
    if (result.error.startsWith("Could not")) throw new Error(result.error);
    notFound();
  }
  return result;
});

function lessonPath(courseSlug: string, lessonSlug: string) {
  return `/course/${courseSlug}/${lessonSlug}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, blog } = await params;
  const courseSlug = slug.toLowerCase();
  const lessonSlug = blog.toLowerCase();
  const result = await loadLesson(courseSlug, lessonSlug);
  const path = lessonPath(courseSlug, lessonSlug);
  const article = result.blog;
  const hidden = Boolean(
    result.locked ||
    result.course.status !== "published" ||
    article?.noindex ||
    isHiddenBlogStatus(article?.status) ||
    article?.status === "unlisted"
  );
  const title = cleanMetaText(article?.title || result.lesson.title, "Course lesson");

  return createPageMetadata({
    path,
    title,
    description: cleanMetaText(article?.seoDescription || article?.description || result.lesson.description, `Read ${title} on Studic.`),
    image: article?.thumbnail || result.lesson.thumbnail,
    ogImage: article?.ogImage,
    seoTitle: article?.seoTitle,
    seoDescription: article?.seoDescription,
    seoKeywords: article?.seoKeywords,
    canonicalUrl: article?.canonicalUrl,
    type: "article",
    publishedTime: article?.publishedAt,
    modifiedTime: article?.updatedAt,
    noindex: hidden,
  });
}

export default async function CourseLessonPage({ params }: Props) {
  const resolved = await params;
  const courseSlug = resolved.slug.toLowerCase();
  const lessonSlug = resolved.blog.toLowerCase();
  if (resolved.slug !== courseSlug || resolved.blog !== lessonSlug) {
    permanentRedirect(lessonPath(courseSlug, lessonSlug));
  }

  const result = await loadLesson(courseSlug, lessonSlug);
  const path = lessonPath(courseSlug, lessonSlug);
  const canonical = resolveCanonical(path, result.blog?.canonicalUrl);
  const isPublic = Boolean(
    result.blog &&
    !result.locked &&
    result.course.status === "published" &&
    !result.blog.noindex &&
    !isHiddenBlogStatus(result.blog.status) &&
    result.blog.status !== "unlisted"
  );

  return (
    <>
      {isPublic && result.blog ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: result.blog.title,
              description: cleanMetaText(result.blog.seoDescription || result.blog.description, `Read ${result.blog.title || "this lesson"} on Studic.`),
              image: result.blog.ogImage || result.blog.thumbnail || undefined,
              datePublished: isoDate(result.blog.publishedAt),
              dateModified: isoDate(result.blog.updatedAt),
              mainEntityOfPage: canonical,
              publisher: { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: "Studic", url: absoluteUrl("/") },
              articleSection: Array.isArray(result.blog.category) ? result.blog.category : undefined,
              keywords: Array.isArray(result.blog.tags) ? result.blog.tags : undefined,
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Courses", path: "/courses" },
              { name: String(result.course.title || "Course"), path: `/course/${courseSlug}` },
              { name: String(result.lesson.title || "Lesson"), path },
            ]),
          ],
        }} />
      ) : null}
      <CourseLesson key={path} params={{ slug: courseSlug, blog: lessonSlug }} initialResult={result} />
    </>
  );
}

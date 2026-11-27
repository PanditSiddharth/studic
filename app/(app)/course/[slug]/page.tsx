import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import CourseDetail from "@/components/course/course-detail";
import JsonLd from "@/components/seo/json-ld";
import { getCourse } from "@/server-functions/course";
import { getItemAccess } from "@/server-functions/library";
import { absoluteUrl, breadcrumbSchema, cleanMetaText, createPageMetadata, resolveCanonical } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const loadCourse = cache((slug: string) => getCourse({ slug, blogs: true, products: true }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const result = await loadCourse(normalizedSlug);
  if ("error" in result) {
    return createPageMetadata({
      path: `/course/${normalizedSlug}`,
      title: "Course unavailable",
      description: "This course could not be found.",
      noindex: true,
    });
  }

  const title = cleanMetaText(result.title, "Online course");
  return createPageMetadata({
    path: `/course/${normalizedSlug}`,
    title,
    description: cleanMetaText(result.description, `Learn ${title} with a practical course on Studic.`),
    image: result.thumbnail,
    ogImage: result.ogImage,
    seoTitle: result.seoTitle,
    seoDescription: result.seoDescription,
    seoKeywords: result.seoKeywords,
    canonicalUrl: result.canonicalUrl,
    noindex: result.noindex || result.status !== "published",
  });
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  if (slug !== normalizedSlug) permanentRedirect(`/course/${normalizedSlug}`);

  const result = await loadCourse(normalizedSlug);
  if ("error" in result) {
    if (result.error === "No course found") notFound();
    throw new Error(result.error);
  }

  const initialAccess = result._id ? await getItemAccess({ courseId: String(result._id) }) : null;
  const path = `/course/${normalizedSlug}`;
  const canonical = resolveCanonical(path, result.canonicalUrl);
  const isPublic = result.status === "published" && !result.noindex;

  return (
    <>
      {isPublic ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Course",
              name: result.title,
              description: result.description,
              url: canonical,
              image: result.ogImage || result.thumbnail || undefined,
              provider: { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: "Studic", url: absoluteUrl("/") },
              offers: {
                "@type": "Offer",
                price: Number(result.price || 0),
                priceCurrency: result.currency || "INR",
                availability: "https://schema.org/InStock",
                url: canonical,
              },
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Courses", path: "/courses" },
              { name: String(result.title || "Course"), path },
            ]),
          ],
        }} />
      ) : null}
      <CourseDetail
        key={normalizedSlug}
        slug={normalizedSlug}
        initialCourse={result}
        initialAccess={initialAccess}
      />
    </>
  );
}

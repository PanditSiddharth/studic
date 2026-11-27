import type { Metadata } from "next";
import HomePage from "@/components/home-page";
import { createPageMetadata } from "@/lib/seo";
import { getBlogs } from "@/server-functions/blog";
import { getCourses } from "@/server-functions/course";
import { getPublishedProducts } from "@/server-functions/product";

export const metadata: Metadata = createPageMetadata({
  path: "/",
  title: "Online Courses & Study Resources",
  description: "Learn and grow with Studic through practical online courses, study guides, useful articles, and downloadable resources for students and curious builders.",
});

export default async function Page() {
  const [courses, blogs, products] = await Promise.all([
    getCourses({ skip: 0, postsPerPage: 4 }),
    getBlogs({ skip: 0, postsPerPage: 4, publicOnly: true }),
    getPublishedProducts({ skip: 0, postsPerPage: 4 }),
  ]);
  if ("error" in courses) throw new Error(courses.error);
  if ("error" in blogs) throw new Error(blogs.error);
  if ("error" in products) throw new Error(products.error);

  return (
    <HomePage
      initialCourses={courses.courses}
      initialBlogs={blogs.blogs}
      initialProducts={products.products}
    />
  );
}

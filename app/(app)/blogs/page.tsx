import type { Metadata } from "next";
import BlogsBrowser from "@/components/blog/blogs-browser";

export const metadata: Metadata = {
  title: "Articles",
  description: "Notes, guides and practical walkthroughs for students and builders.",
  alternates: { canonical: "/blogs" },
};

export default function BlogsPage() {
  return <BlogsBrowser />;
}

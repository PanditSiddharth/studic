import type { Metadata } from "next";
import BlogsBrowser from "@/components/blog/blogs-browser";

export const metadata: Metadata = {
  title: "Articles · Studic",
  description: "Notes, guides and practical walkthroughs for students and builders.",
};

export default function BlogsPage() {
  return <BlogsBrowser />;
}

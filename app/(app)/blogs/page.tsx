import { createPageMetadata } from "@/lib/seo";
import BlogsBrowser from "@/components/blog/blogs-browser";
import { getBlogs } from "@/server-functions/blog";

const PAGE_SIZE = 9;

export const metadata = createPageMetadata({
  path: "/blogs",
  title: "Articles",
  description: "Notes, guides and practical walkthroughs for students and builders.",
});

export default async function BlogsPage() {
  const initialResult = await getBlogs({
    skip: 0,
    postsPerPage: PAGE_SIZE,
    search: "",
    publicOnly: true,
  });
  if ("error" in initialResult) throw new Error(initialResult.error);

  return (
    <BlogsBrowser
      initialBlogs={initialResult.blogs ?? []}
      initialTotal={initialResult.totalBlogs ?? 0}
    />
  );
}

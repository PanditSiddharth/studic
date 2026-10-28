import BlogArticle from "@/components/blog/blog-article";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  return <BlogArticle params={resolved} />;
}

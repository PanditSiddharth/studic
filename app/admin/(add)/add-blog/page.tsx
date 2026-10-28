import type { IBlog } from "@/modals/blog.model";
import { getBlog } from "@/server-functions/blog";
import { getProductOptions } from "@/server-functions/product";
import AddBlogForm from "./blog-form";

export default async function AddBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ _id?: string; slug?: string }>;
}) {
  const params = await searchParams;
  let initialValue: Partial<IBlog> | undefined;
  let loadError: string | undefined;

  if (params.slug || params._id) {
    const result = await getBlog({ slug: params.slug, _id: params._id });
    if ("error" in result) {
      loadError = result.error;
    } else {
      initialValue = result as Partial<IBlog>;
    }
  }

  const products = await getProductOptions();

  return <AddBlogForm initialValue={initialValue} loadError={loadError} productOptions={products} />;
}

import { createPageMetadata } from "@/lib/seo";
import ProductsBrowser from "@/components/product/products-browser";
import { getPublishedProducts } from "@/server-functions/product";

const PAGE_SIZE = 12;

export const metadata = createPageMetadata({
  path: "/products",
  title: "Digital products",
  description: "Templates, notes, cheatsheets and starter kits for your learning journey. Claim free resources and keep them in your library.",
});

export default async function ProductsPage() {
  const initialResult = await getPublishedProducts({ skip: 0, postsPerPage: PAGE_SIZE, search: "" });
  if ("error" in initialResult) throw new Error(initialResult.error);

  return (
    <ProductsBrowser
      initialProducts={initialResult.products ?? []}
      initialTotal={initialResult.totalProducts ?? 0}
    />
  );
}

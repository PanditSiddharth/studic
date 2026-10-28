import AddProductForm from "./product-form";
import { getAdminProductBySlug } from "@/server-functions/admin-content";

export default async function AddProductPage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const params = await searchParams;
  let initialValue;
  if (params.slug) {
    const result = await getAdminProductBySlug(params.slug);
    if ("error" in result) {
      return <main className="p-8"><h1 className="text-xl font-semibold">Product unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{result.error}</p></main>;
    }
    initialValue = result;
  }
  return <div className="w-full"><AddProductForm initialValue={initialValue} /></div>;
}

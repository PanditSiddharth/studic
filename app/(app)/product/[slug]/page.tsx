import ProductDetail from "@/components/product/product-detail";

export const metadata = { title: "Product · Studic" };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}

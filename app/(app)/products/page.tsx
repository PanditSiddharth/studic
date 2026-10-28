import type { Metadata } from "next";
import ProductsBrowser from "@/components/product/products-browser";

export const metadata: Metadata = {
  title: "Digital products · Studic",
  description: "Templates, notes, cheatsheets and starter kits for your learning journey. Claim free resources and keep them in your library.",
};

export default function ProductsPage() {
  return <ProductsBrowser />;
}

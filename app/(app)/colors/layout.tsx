import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  path: "/colors",
  title: "Design tokens",
  description: "Studic interface color palette reference.",
  noindex: true,
});

export default function ColorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

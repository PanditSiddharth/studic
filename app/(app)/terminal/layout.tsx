import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  path: "/terminal",
  title: "Terminal demo",
  description: "Interactive terminal demonstration.",
  noindex: true,
});

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  path: "/payment",
  title: "Secure payment",
  description: "Continue to the secure payment provider for your Studic order.",
  noindex: true,
});

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

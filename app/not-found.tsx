import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for could not be found.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This link may be incorrect or the page may have moved.</p>
      <Link href="/" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go to Studic home</Link>
    </main>
  );
}

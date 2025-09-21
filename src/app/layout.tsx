// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudIC - Free Study Materials & Courses",
  description: "Access high-quality educational content, download study materials, and enhance your learning journey with our curated collection of courses and resources.",
  keywords: "study materials, free courses, education, learning resources, download materials",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
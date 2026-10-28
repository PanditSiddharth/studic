import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/navbar/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import localFont from "next/font/local";
import { DOMAIN } from "@/lib/seo";
const tdb = localFont({
  src: "../public/fonts/tdb.ttf",
  variable: "--tdb",
  weight: "400",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "Studic | Learn, Build and Grow",
    template: "%s | Studic",
  },
  description: "Learn through practical courses, articles and downloadable resources on Studic.",
  applicationName: "Studic",
  keywords: ["online courses", "programming tutorials", "study resources", "digital products", "Studic"],
  authors: [{ name: "Studic" }],
  creator: "Studic",
  publisher: "Studic",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Studic",
    title: "Studic | Learn, Build and Grow",
    description: "Practical courses, useful articles and downloadable resources for learners and builders.",
    url: DOMAIN,
  },
  twitter: {
    card: "summary_large_image",
    title: "Studic | Learn, Build and Grow",
    description: "Practical courses, useful articles and downloadable resources.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeOptions = {
    // attribute: "class",
    defaultTheme: "blue",
    enableSystem: true,
  };
  return (
    <html lang="en" suppressHydrationWarning >
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2233066744078073"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tdb.variable} antialiased relative w-full h-full `}
      >

        <SessionProvider >
          <ThemeProvider {...themeOptions} attribute={"class"}>
            <Navbar />
            <div className="w-72 h-72 rounded-full bg-purple-600/30 blur-[128px] absolute  left-5 top-0 z-[-1]" />
            <div className="w-72 h-72 rounded-full bg-purple-600/20 blur-[128px] absolute  left-20 top-[50%] z-[-1]" />
            <div className="w-72 h-72 rounded-full bg-purple-600/30 blur-[128px] absolute  right-0 top-[70%] z-[-1]" />
            {children}
            <ToastProvider />

          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

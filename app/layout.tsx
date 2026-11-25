import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/navbar/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import localFont from "next/font/local";
import { absoluteUrl, DOMAIN } from "@/lib/seo";
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
    default: "Studic | Online Courses & Study Resources",
    template: "%s | Studic",
  },
  description: "Learn and grow with Studic through practical online courses, study guides, useful articles, and downloadable resources for students and curious builders.",
  applicationName: "Studic",
  keywords: ["Studic", "online courses", "study resources", "IGNOU study resources", "programming tutorials", "digital learning resources"],
  authors: [{ name: "Studic" }],
  creator: "Studic",
  publisher: "Studic",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/studic-neon-orbit-logo.png", type: "image/png", sizes: "768x768" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "Studic",
    title: "Studic | Online Courses & Study Resources",
    description: "Practical online courses, study guides, articles, and downloadable learning resources for students and curious builders.",
    url: DOMAIN,
    images: [
      {
        url: absoluteUrl("/studic-og.png"),
        width: 1200,
        height: 630,
        alt: "Studic - Learn, Build and Grow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studic | Online Courses & Study Resources",
    description: "Practical courses, study guides, articles, and downloadable learning resources.",
    images: [absoluteUrl("/studic-og.png")],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Studic",
              url: DOMAIN,
              logo: absoluteUrl("/studic-neon-orbit-logo.png"),
              sameAs: [
                "https://youtube.com/ignoustudycenter",
                "https://telegram.me/ignoustudychannel",
                "https://github.com/PanditSiddharth",
                "https://linkedin.com/in/sidsharma0",
              ],
            }),
          }}
        />
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
            <div className="w-72 h-72 rounded-full bg-purple-600/7 blur-[128px] absolute  left-5 top-0 z-[-1]" />
            <div className="w-72 h-72 rounded-full bg-purple-600/10 blur-[128px] absolute  left-20 top-[50%] z-[-1]" />
            <div className="w-72 h-72 rounded-full bg-purple-600/7 blur-[128px] absolute  right-0 top-[70%] z-[-1]" />
            {children}
            <ToastProvider />

          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

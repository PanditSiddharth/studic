import type { Metadata } from "next";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Learn with Studic",
  description: "Explore practical courses, articles and digital resources on Studic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="container max-w-7xl mx-auto">
      {children}
      <Footer />
    </div>
  );
}

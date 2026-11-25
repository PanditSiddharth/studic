import Footer from "@/components/footer";

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

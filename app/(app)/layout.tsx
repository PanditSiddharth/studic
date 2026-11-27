import Footer from "@/components/footer";
import GoogleOneTap from "@/components/auth/google-one-tap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="container max-w-7xl mx-auto">
      <GoogleOneTap clientId={process.env.AUTH_GOOGLE_ID} />
      {children}
      <Footer />
    </div>
  );
}

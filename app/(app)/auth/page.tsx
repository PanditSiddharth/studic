import type { Metadata } from "next";
import AuthScreen from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your Studic account to follow courses and keep every resource you unlock.",
  alternates: { canonical: "/auth" },
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return <AuthScreen />;
}

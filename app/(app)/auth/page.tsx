import type { Metadata } from "next";
import AuthScreen from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign in · Studic",
  description: "Sign in or create your Studic account to follow courses and keep every resource you unlock.",
};

export default function AuthPage() {
  return <AuthScreen />;
}

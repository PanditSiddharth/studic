import AuthScreen from "@/components/auth/auth-screen";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/auth",
  title: "Sign in",
  description: "Sign in or create your Studic account to follow courses and keep every resource you unlock.",
  noindex: true,
});

export default function AuthPage() {
  return <AuthScreen />;
}

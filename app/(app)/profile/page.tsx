import type { Metadata } from "next";
import ProfileView from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "My library",
  description: "Your enrolled courses, owned products and order history in one place.",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}

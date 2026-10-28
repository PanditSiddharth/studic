import type { Metadata } from "next";
import ProfileView from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "My library · Studic",
  description: "Your enrolled courses, owned products and order history in one place.",
};

export default function ProfilePage() {
  return <ProfileView />;
}

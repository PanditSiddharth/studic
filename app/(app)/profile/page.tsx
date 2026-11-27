import ProfileView from "@/components/profile/profile-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/profile",
  title: "My library",
  description: "Your enrolled courses, owned products and order history in one place.",
  noindex: true,
});

export default function ProfilePage() {
  return <ProfileView />;
}

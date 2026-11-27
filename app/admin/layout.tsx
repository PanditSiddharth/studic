import type { Metadata } from "next";
import AdminLayout from "@/components/admin/admin-layout";

export const metadata: Metadata = {
  title: {
    default: "Admin workspace",
    template: "%s | Studic Admin",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText, GraduationCap, Package, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "product", route: "/admin/add-product", href: "/admin/add-product", label: "Products", short: "Product", icon: Package },
  { value: "blog", route: "/admin/add-blog", href: "/admin/add-blog", label: "Articles", short: "Article", icon: FileText },
  { value: "course", route: "/admin/add-course", href: "/admin/add-course", label: "Courses", short: "Course", icon: GraduationCap },
  { value: "admin", route: "/admin/add-admin", href: "/admin/add-admin", label: "Admins", short: "Admin", icon: ShieldCheck },
];

export default function AddRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = tabs.find((tab) => pathname.startsWith(tab.route))?.value ?? "product";

  return (
    <div className="w-full">
      <div className="sticky top-16 z-20 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-5 py-2.5 sm:px-8">
          <Tabs value={active} onValueChange={(value) => router.push(tabs.find((tab) => tab.value === value)?.href ?? "/admin/add-product")}>
            <TabsList className="h-10 justify-start gap-1 bg-muted/60 p-1">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 px-3 text-xs sm:text-sm">
                  <tab.icon size={15} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      {children}
    </div>
  );
}

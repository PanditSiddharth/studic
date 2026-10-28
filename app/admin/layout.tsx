"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BookOpen, Boxes, FileText, GraduationCap, LayoutDashboard,
  MessageSquare, Package, PlusCircle, ShoppingCart, Star, Users,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { NavbarDropdown } from "@/components/navbar/navbar-dropdown";

const groups = [
  { title: "Workspace", items: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
  ]},
  { title: "Content", items: [
    { label: "Courses", href: "/admin/courses", icon: GraduationCap },
    { label: "Articles", href: "/admin/blogs", icon: FileText },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Create content", href: "/admin/add-course", icon: PlusCircle },
  ]},
  { title: "Platform", items: [
    { label: "Users & sellers", href: "/admin/users", icon: Users },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Enrollments", href: "/admin/enrollments", icon: BookOpen },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Support queries", href: "/admin/queries", icon: MessageSquare },
    { label: "Chats", href: "/chat", icon: MessageSquare },
  ]},
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <Link href="/admin" className="flex h-16 items-center gap-3 border-b px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">S</span>
          <span><span className="block text-base font-semibold tracking-tight">Studic</span><span className="block text-xs text-muted-foreground">Admin workspace</span></span>
        </Link>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {groups.map((group) => <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.title}</p>
            <div className="space-y-1">{group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon size={17} strokeWidth={1.8}/><span>{item.label}</span>
              </Link>;
            })}</div>
          </div>)}
        </nav>
        <div className="border-t p-4"><p className="text-xs text-muted-foreground">Content, commerce & community</p><div className="mt-3 flex items-center justify-between"><span className="text-sm font-medium">Appearance</span><ModeToggle /></div></div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div><p className="text-xs text-muted-foreground">Studic / Admin</p><p className="text-sm font-medium">{groups.flatMap(g => g.items).find(item => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href + "/")))?.label || "Workspace"}</p></div>
          <NavbarDropdown />
        </header>
        {children}
      </div>
    </div>
  );
}

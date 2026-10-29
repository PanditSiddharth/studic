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
    { label: "Chat media", href: "/admin/chat-settings", icon: MessageSquare },
  ]},
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-card lg:flex lg:flex-col">
        <Link href="/admin" className="flex h-20 items-center gap-3 border-b px-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">S</span>
          <span><span className="block text-base font-semibold tracking-tight">Studic</span><span className="mt-0.5 block text-xs text-muted-foreground">Admin control center</span></span>
        </Link>
        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {groups.map((group) => <div key={group.title}>
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">{group.title}</p>
            <div className="space-y-1">{group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon size={17} strokeWidth={1.8}/><span>{item.label}</span>
              </Link>;
            })}</div>
          </div>)}
        </nav>
        <div className="m-4 rounded-2xl border bg-muted/50 p-4"><p className="text-xs font-medium">Content, commerce & community</p><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">Appearance</span><ModeToggle /></div></div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex h-20 items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Studic / Admin</p><p className="mt-1 text-lg font-semibold tracking-tight">{groups.flatMap(g => g.items).find(item => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href + "/")))?.label || "Workspace"}</p></div>
            <NavbarDropdown />
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-3 lg:hidden">
            {groups.flatMap(group => group.items.slice(0, group.title === "Platform" ? 4 : group.items.length)).map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item.label}</Link>;
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

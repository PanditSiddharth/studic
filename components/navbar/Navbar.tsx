"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen, FileText, LayoutDashboard, Library, LogOut, Menu, MessageCircle, Package,
} from "lucide-react";
import { NavbarDropdown } from "./navbar-dropdown";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/modals/utils";

const links = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/products", label: "Products", icon: Package },
  { href: "/blogs", label: "Articles", icon: FileText },
];

const isLinkActive = (pathname: string, href: string) =>
  pathname === href ||
  pathname.startsWith(`${href}/`) ||
  (href === "/courses" && pathname.startsWith("/course/"));

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthPage = pathname === "/auth" || pathname === "/login";
  const user = session?.user;
  const signedIn = status === "authenticated";
  const initials = String(user?.name || user?.email || "S").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Studic home">
            <span className="font-tdb text-xl leading-none text-transparent bg-gradient-to-r from-primary to-purple-400 bg-clip-text">
              Studic
            </span>
          </Link>

          {!isAuthPage && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {links.map((link) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ModeToggle />

          {signedIn ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden gap-1.5 md:inline-flex">
                <Link href="/profile">
                  <Library size={15} /> My library
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden gap-1.5 md:inline-flex">
                <Link href="/chat">
                  <MessageCircle size={15} /> Chats
                </Link>
              </Button>
              <NavbarDropdown />
            </>
          ) : !isAuthPage && status !== "loading" ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm shadow-primary/20">
                <Link href="/auth?mode=signup">Create account</Link>
              </Button>
            </div>
          ) : null}

          {!isAuthPage && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[320px] flex-col gap-0 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Browse courses, products and articles, or manage your account.
                </SheetDescription>

                <SheetHeader className="border-b px-5 py-4 text-left">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-sm font-bold text-primary-foreground">
                      S
                    </span>
                    <span className="font-tdb text-lg leading-none">Studic</span>
                  </Link>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                  <nav className="space-y-1" aria-label="Mobile">
                    {links.map((link) => {
                      const active = isLinkActive(pathname, link.href);
                      return (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            )}
                          >
                            <link.icon size={17} />
                            {link.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>

                  {signedIn ? (
                    <div className="space-y-3 border-t pt-5">
                      <div className="flex items-center gap-3 px-2">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{user?.name || "Learner"}</span>
                          <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                        </span>
                      </div>
                      <SheetClose asChild>
                        <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground">
                          <Library size={17} /> My library
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/chat" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground">
                          <MessageCircle size={17} /> Chats
                        </Link>
                      </SheetClose>
                      {user?.role === "admin" && (
                        <SheetClose asChild>
                          <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground">
                            <LayoutDashboard size={17} /> Admin dashboard
                          </Link>
                        </SheetClose>
                      )}
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); void signOut({ callbackUrl: "/" }); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        <LogOut size={17} /> Log out
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2 border-t pt-5">
                      <SheetClose asChild>
                        <Button asChild variant="outline">
                          <Link href="/auth">Sign in</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild>
                          <Link href="/auth?mode=signup">Create account</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}

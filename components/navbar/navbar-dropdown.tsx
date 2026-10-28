"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Library, LogOut, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const NavbarDropdown = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const user = session?.user;
  const initials = String(user?.name || user?.email || "S").trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.image} alt={user?.name || "Account"} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image} alt={user?.name || "Account"} />
            <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{user?.name || "Learner"}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex w-full items-center" onClick={() => setIsOpen(false)}>
            <Library className="mr-2 h-4 w-4" /> My library
          </Link>
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <ShieldCheck size={12} /> Admin
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex w-full items-center" onClick={() => setIsOpen(false)}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Admin dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex w-full cursor-pointer items-center text-destructive focus:text-destructive"
          onSelect={() => { setIsOpen(false); void signOut({ callbackUrl: "/" }); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

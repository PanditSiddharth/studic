"use client"
import { Eye, LucideMoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IUser } from "@/modals/user.model";

import Link from "next/link";

export default function UserActionDropdown({ user, setOpenedDelete }:
     { user: IUser, setOpenedDelete: any }) {
  

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    aria-label="Open menu"
                    className="rounded-full h-6 w-6 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-200 outline-none border-none absolute right-1 top-1"
                >
                    <LucideMoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {/* First Item */}
                <DropdownMenuItem asChild>
                    <Link href={`/@${user.username}`}>
                        <div className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View User</span>
                        </div>
                    </Link>
                </DropdownMenuItem>

                {/* Second Item */}
                <DropdownMenuItem asChild>
                    <div
                        onClick={() => setOpenedDelete(true)}
                        className="flex items-center text-red-600 hover:text-red-800 cursor-pointer"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete User
                    </div>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}

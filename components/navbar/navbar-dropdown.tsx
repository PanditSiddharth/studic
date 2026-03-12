"use client"
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FaUserCircle, FaUserLock } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { RiBloggerLine } from "react-icons/ri";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BiSolidContact } from "react-icons/bi";
import { LuLogIn, LuLogOut } from "react-icons/lu";
import { Accordion } from "@/components/ui/accordion"
import { Acc } from "./Accordian";
import { HomeIcon, ReceiptText, Settings } from "lucide-react";
import { FcAbout } from "react-icons/fc";
import { IoBookOutline } from "react-icons/io5";
import { MdOutlineAnalytics } from "react-icons/md";

export const NavbarDropdown = () => {

    const { data: session, status } = useSession();
    const pathname = usePathname();
    const navigations = [
        { name: "Home", href: "/", icon: HomeIcon },
        { name: "Courses", href: "/courses", icon: IoBookOutline },
        { name: "Blogs", href: "/blogs", icon: RiBloggerLine },
        { name: "About", href: "/about", icon: FcAbout },
        { name: "Contact", href: "/contact", icon: BiSolidContact },
        { name: "Privacy", href: "/privacy", icon: BiSolidContact }
    ];

    const others = [
        { name: "Terms & Conditions", href: "/tnc", icon: ReceiptText },
        { name: "Privacy Policy", href: "/privacy", icon: FaUserLock }
    ];

    const adminPannel = [
        { name: "Admin Home", href: "/admin/", icon: HomeIcon },
        { name: "Courses", href: "/admin/courses", icon: IoBookOutline },
        { name: "Add Blog", href: "/admin/add-blog", icon: RiBloggerLine },
        { name: "Tools", href: "/admin/tools", icon: Settings },
        { name: "Analytics", href: "/admin/analytics", icon: MdOutlineAnalytics }
    ];

    const user = session?.user;

    // State to track if the dropdown is open
    const [isOpen, setIsOpen] = useState(false);

    // Function to close dropdown after navigation
    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage className="rounded-full border-4" src={user?.image} alt={`@${user?.username}`} />
                    <AvatarFallback><FaUserCircle className="w-7 h-7 opacity-80" /></AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 mr-3 h-auto">
                <Accordion type="single" defaultValue="Navigate" collapsible>

                    {/* <DropdownMenuSeparator /> */}
                    <Acc title={"Navigate"}>
                        <DropdownMenuGroup>
                            {navigations.map((navItem, index) => (
                                <DropdownMenuItem key={index} className={`${pathname == navItem.href && 'bg-primary/5'}`}>
                                    <Link href={navItem.href} className="w-full flex" onClick={handleLinkClick}>
                                        {<navItem.icon className="h-4 w-4 mr-2 mt-0.5" />} {navItem.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </Acc>

                    <Acc title={"Auth"}>
                        {status === 'unauthenticated' ? (
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Link href="/auth" className="w-full flex" onClick={handleLinkClick}>
                                    <LuLogIn className="h-4 w-4 mr-2 mt-0.5" /> Sign In
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>) : (
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Link href="/auth" className="w-full flex" onClick={() => { signOut() }}>
                                    {<LuLogOut className="h-4 w-4 mr-2 mt-0.5" />}  Logout
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        )}
                    </Acc>


                    {status === 'authenticated' && user?.role == "admin" && (
                        <Acc title={"Admin Pannel"}>
                            <DropdownMenuGroup>
                                {adminPannel.map((navItem, index) => (
                                    <DropdownMenuItem key={index} className={`${pathname == navItem.href && 'bg-primary/5'}`}>
                                        <Link href={navItem.href} className="w-full flex" onClick={handleLinkClick}>
                                            {<navItem.icon className="h-4 w-4 mr-2 mt-0.5" />} {navItem.name}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </Acc>)}


                    <Acc title={"Others"}>
                        <DropdownMenuGroup>
                            {others.map((navItem, index) => (
                                <DropdownMenuItem key={index} className={`${pathname == navItem.href && 'bg-primary/5'}`}>
                                    <Link href={navItem.href} className="w-full flex" onClick={handleLinkClick}>
                                        {<navItem.icon className="h-4 w-4 mr-2 mt-0.5" />} {navItem.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </Acc>
                </Accordion>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

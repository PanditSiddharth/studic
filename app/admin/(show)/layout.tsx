"use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AddRootPage({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname()
    const handleTabChange = (value: string) => {
        const routes = {
            products: "/admin/products",
            blogs: "/admin/blogs",
            courses: "/admin/courses",
            users: "/admin/users"
        }
        router.push(routes[value as "products"]);
    };

    return (
        <div className="w-full">
            <Tabs defaultValue={pathname?.split("/")[2]?.split("?")[0]} value={pathname?.split("/")[2]?.split("?")[0]} onValueChange={handleTabChange} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="blogs">Blogs</TabsTrigger>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

            </Tabs>
            <div className="w-full flex md:flex-row flex-col gap-4">
                {children}
            </div>
        </div>
    );
}

export default AddRootPage;
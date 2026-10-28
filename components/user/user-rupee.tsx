"use client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { EyeIcon } from "lucide-react";
import { IUser } from "@/modals/user.model";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserOptions } from "@/types";
import clsx from "clsx";

import { toast } from "@/hooks/use-toast";
const UserCard = ({
    user,
    username,
    options,
}: {
    user: IUser; // Extend IUser with revenue-related fields
    username?: string;
    options: UserOptions;
    setUser: (user: IUser) => void;
}) => {
    const [isOwner, setIsOwner] = useState(false);

    const { data: session, status } = useSession();

    const showToast = (description: string, variant: "destructive" = "destructive") => {
        toast({
            title: "Error!",
            description,
            variant,
            duration: 1000
        })
    }

  
console.log(showToast)

    useEffect(() => {
        if (
            username?.split("@")[1] === session?.user.username ||
            session?.user.role == "admin"
        )
            setIsOwner(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    if (!user) {
        return <div>Faltu ka call kiu kar raha</div>;
    }

    options.hz = options.hz || false;
  
    return (
        <Card className="flex flex-col overflow-hidden rounded-md shadow-lg ">
            {/* Profile Section */}
            <Card className={
                clsx("flex", "overflow-hidden relative rounded-none  ", !options.hz && "md:flex-col")
            }>
                <CardHeader className="px-2 py-0">
                    <Link href={`/@${user.username}`}
                        className={clsx("relative", "aspect-square", "md:aspect-square", "blur-animation h-full rounded-full",
                            !options.hz ? "md:w-full" : "md:h-full",
                            !options.hz ? "md:h-auto" : "md:w-auto"
                        )}
                    >
                        <Image
                            src={user?.image + ""}
                            alt={user.name}
                            fill
                    className="object-cover rounded-full p-1"
                        />
                        {isOwner &&
                            <div className="relative">
                                <EyeIcon className="absolute bottom-0 right-0 text-gray-500" size={24} />
                            </div>
                        }
                    </Link>
                </CardHeader>

                <div className="pl-4 flex flex-col justify-center h-full min-h-28">
                    <CardTitle className="min-h-5 line-clamp-2">{user.name}</CardTitle>
                    <CardDescription className="text-xs min-h-5 line-clamp-2">
                        @ {user.username}
                    </CardDescription>
                    <Link href={`/@${user.username}/products`} className=" text-blue-600">
                        View Profile
                    </Link>
                </div>
            </Card>



        </Card>
    );
};

export default UserCard;

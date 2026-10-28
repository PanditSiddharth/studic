"use client"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { EyeIcon } from "lucide-react"
import { IUser } from "@/modals/user.model"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { UserOptions } from "@/types"
import clsx from "clsx"
import UserActionDropdown from "./user-action"
import HandleDeleteAccount from "./delete-profile"

const UserCard = ({ user, username, options }: { user: IUser, username?: string, options: UserOptions }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isOwner, setIsOwner] = useState(false)
    const { data: session, status } = useSession()
    const [openedDelete, setOpenedDelete] = useState(false);
    useEffect(() => {
        if (username?.split('@')[1] === session?.user.username || session?.user.role == "admin")
            setIsOwner(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])
    if (!user) {
        return <div>Faltu ka call kiu kar raha</div>;
    }


    options.hz = options.hz || false

    return (<Card className={
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
            <CardDescription className="text-xs min-h-5 line-clamp-2">
            
             Products  {(user as {products: number} & IUser)?.products?.toString()}
            </CardDescription>
        <Link href={`/@${user.username}/products`} className=" text-blue-600">
            View Profile
        </Link>
        </div>
        <div  className="w-screen h-screen absolute">
        <HandleDeleteAccount
                    user={user}
                    openedDelete={openedDelete}
                    setOpenedDelete={setOpenedDelete}
                    
                />
        </div>
        {session?.user.role == "admin" && <UserActionDropdown user={user} setOpenedDelete={setOpenedDelete}/>}
    </Card>);
}

export default UserCard;
"use client"
import { User } from "lucide-react";
import Link from "next/link";
import { JSX } from "react";
type Routes = {
    label: string;
    icon: JSX.ElementType;
    route: string;
}
const Sidebar = ({ routes }: { routes: Routes[] }) => {

    return (
        <div className={`w-full h-full flex flex-col justify-center  text-secondary-foreground/80 p-4`} >
            <div className="flex flex-col justify-between items-center h-full">
                <div className="w-full h-full flex  font-semibold flex-col gap-1">
                    {routes.map((route, index) => (
                        <Link href={route.route} key={index} className={`w-full h-12 flex items-center cursor-pointer justify-start pl-3 hover:bg-primary/5  rounded-md`}>
                            <route.icon className="w-6 h-6" />
                            <p className="ml-2">{route.label}</p>
                        </Link>
                    ))}
                </div>
                <Link href={`/`} className={`w-full h-12 flex items-center cursor-pointer justify-between px-3 bg-primary/50 hover:bg-primary/60 text-secondary-foreground rounded-md`}>
                    <p className="ml-2">HOME</p>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center "bg-primary/80 hover:bg-primary/90"`}>
                        <User className="w-4 h-4" />
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default Sidebar
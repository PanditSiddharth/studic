"use client"
import useUsersStore from "@/hooks/use-users";
import { useEffect, useState, useTransition } from "react";
import { BarLoader } from "react-spinners";
import UserCard from "@/components/user/user-card";
import InfiniteScroll from 'react-infinite-scroll-component'
import { cn } from "@/modals/utils";
import { UserOptions } from "@/types";
import clsx from "clsx";
import UserRevenueCard from "./user-rupee";
import { Button } from "../ui/button";
import { RxCross2 } from "react-icons/rx";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
interface UsersListProps {
    username?: string,
    options: UserOptions
}
const UsersList = ({ username, options }: UsersListProps) => {
    const list = options?.list || {
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
    }

    const { getUsers, users, page, increasePage, totalUsers, setUser } = useUsersStore();
    const [loading, setTransition] = useTransition()
    const [search, setSearch] = useState("")
    const [searchBy, setSearchBy] = useState("")
    const [tempSearch, setTempSearch] = useState("")
 
    const handelScroll = () => {
        getUsers({ page: page + 1, username, postsPerPage: 10, search, searchBy }, true);
        increasePage()
    }

    useEffect(() => {
        setTransition(async () => {
            await getUsers({ page: 1, username, postsPerPage: 10, search, searchBy });
        })
    }, [getUsers, username, search, searchBy]);

    const searchElement = <div className="flex gap-2 flex-col md:flex-row px-2 md:px-4 max-w-3xl">
        <div className="flex w-full">
            <div className="relative">
                {search ? <RxCross2 className="absolute h-4 left-2 top-3 cursor-pointer" onClick={() => { setTempSearch(""); setSearch("") }} /> :
                    <Search className="absolute h-4 left-2 top-2.5 cursor-pointer" onClick={() => setSearch(tempSearch)} />}
            </div>
            <Input placeholder="Search Products " className="pl-8 rounded-lg" value={tempSearch} onChange={e => setTempSearch(e.target.value)} />
            <div className="relative">
                <Button className="absolute right-0 bg-slate-400 rounded-l-none dark:text-gray-100 dark:bg-gray-800" onClick={() => setSearch(tempSearch)}>Search</Button>
            </div>
        </div>

        <select
            className="flex h-9 w-full rounded-lg border border-input dark:bg-gray-950 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => { setSearchBy(e.target.value) }} value={searchBy}>
            {[
                {
                    key: '',
                    value: 'Search by anything..'
                },
                {
                    key: 'name',
                    value: 'Name'
                },
                {
                    key: "username",
                    value: 'Username'
                },
                {
                    key: "about",
                    value: 'About'
                },
                {
                    key: "userId",
                    value: 'User ID'
                }
            ].map((cat, index) => (
                <option key={index} value={cat.key}>
                    {cat.value}
                </option>
            ))
            }
        </select>
    </div>
    if (loading) {
        return (
            <div className="w-full">
                {searchElement}
                <div className="flex flex-1  justify-center items-center h-64">
                    <BarLoader color="#36d7b7" />
                </div>
            </div>
        )
    }


    if (!users || users.length === 0) {
        return (
            <div className="w-full">
                {searchElement}
                <div className="flex flex-1  justify-center items-center h-64">
                    <p>No users found</p>
                </div>
            </div>
        )
    }
    const arr = {
        sm: ['sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3'],
        md: ['md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5'],
        lg: ['lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
            'lg:grid-cols-5', 'lg:grid-cols-6', 'lg:grid-cols-7']
    }

    return (
        <div className="w-full">
            {searchElement}
            <InfiniteScroll
                dataLength={users.length}
                next={handelScroll}
                className={cn('w-full flex flex-col justify-center items-center pb-5')}
                hasMore={users.length < totalUsers}
                loader={
                    <BarLoader color="#36d7b7" />
                }>
                <div className={clsx(
                    'grid w-full p-4 grid-cols-1',
                    arr['sm'][list.sm - 1],  // Small screens
                    arr['md'][list.md - 1],  // Medium screens
                    arr['lg'][list.lg - 1],  // Large screens
                )}>
                    {
                        users.map((user, index) => (
                            options?.showRupeeCard ? <UserRevenueCard key={index} user={user} 
                            username={username} options={options} setUser={setUser}/>
                            : 
                             <UserCard key={index} user={user} username={username} options={options} />
                        ))
                    }

                </div>
            </InfiniteScroll>
        </div>

    )
}
export default UsersList;
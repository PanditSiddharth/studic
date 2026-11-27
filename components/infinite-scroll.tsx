"use client"
import { BarLoader } from "react-spinners";
import InfiniteScroll, { Props } from 'react-infinite-scroll-component'
import { cn } from "@/modals/utils";
import { useSession } from "next-auth/react";
import { JSX, useEffect, useRef } from "react";

interface DataInfiniteOptions <T> {
    data: T[];
    next: () => void;
    totalLength: number;
    element: (data: T, index: number) => JSX.Element;
    scrollerOptions?: Props
    className?: string;
    className2?: string;
  }
const Scroll = <T,>({ data, next, element, totalLength, scrollerOptions, className, className2}: DataInfiniteOptions<T>) => {

    const { status } = useSession()
    const nextRef = useRef(next)
    useEffect(() => { nextRef.current = next })
    useEffect(() => { nextRef.current() }, [])
    if (status == "loading") {
        return (
            <div className="w-full">
                <div className="flex flex-1  justify-center items-center h-64">
                    <BarLoader color="#36d7b7" />
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full">
                <div className="flex flex-1  justify-center items-center h-64">
                    <p>No data found</p>
                </div>
            </div>
        )
    }
    const currentLength = data?.length;
    return (
        <div className="w-full">
            <InfiniteScroll
                dataLength={currentLength}
                next={next}
                className={cn('w-full flex flex-col justify-center items-center pb-5', className)}
                hasMore={currentLength < totalLength}
                loader={
                    <BarLoader color="#36d7b7" />
                }
                {...scrollerOptions}
                >
                <div className={cn(
                    'grid gap-4 w-full grid-cols-3', className2 )}>
                    {
                        data.map((data, index) => (element(data, index)))
                    }
                </div>
            </InfiniteScroll>
        </div>

    )
}
export default Scroll;
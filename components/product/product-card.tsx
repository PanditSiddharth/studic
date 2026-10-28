"use client"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import Image from "next/image"
import { IndianRupee } from "lucide-react"
import { IProduct } from "@/modals/product.model"

import ProductShareAction from "./product-share-action"
import Link from "next/link"

import { cn } from "@/modals/utils"

export interface ProductOptions {
    product: Partial<IProduct>, 
    className?: string,
    options?: any
}

const ProductCard = ({ product, options, className }: ProductOptions) => {
    if (!product) {
        return <div>Faltu ka call kiu kar raha</div>;
    }

    return (<Card className={
        cn("flex flex-col overflow-hidden relative", className)
    }>
        <CardHeader className="p-0">
            <Link href={`/product/${product.slug}`}
                className={cn("relative aspect-[1.78] blur-animation h-full")}
            >
                <Image
                    src={product.thumbnail!}
                    alt={product.title! || "no title"}
                    fill
                    className="object-cover"
                    className=""
                />
            </Link>
        </CardHeader>
        <div className="h-full w-full flex flex-col justify-between">
            <div>{product.title}</div>
            <CardFooter className="flex justify-between items-center py-1 px-2 min-h-4 bg-slate-50 dark:bg-primary/10">
                <Link href={`/product/${product.slug}`}>
                    <div className="flex items-center">
                        <IndianRupee className="w-4" />
                        <span className="font-bold">
                            {product?.price?.toLocaleString('en-IN')}
                        </span>
                    </div>
                </Link>
                <div className="bg-white/40 hover:bg-white h-8 w-8 flex items-center justify-center overflow-hidden rounded-full">
                    <ProductShareAction product={product} />
                </div>
            </CardFooter>
        </div>
    </Card>);
}

export default ProductCard;
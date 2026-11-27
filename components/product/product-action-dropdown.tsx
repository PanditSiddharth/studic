"use client"
import { Download, Eye, ListCollapseIcon, LucideMoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IProduct } from "@/modals/product.model";
import { confirmDelete } from "./product-delete-action";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProductOptions } from "@/types";
import { showTransactionDetails } from "../others/transaction-details";
import { downloadLink } from "./download-product";
import { usePathname, useRouter } from "next/navigation";

export default function ProductActionDropdown({ product, username, options }: { product: Partial<IProduct> & {transactionId?: string}, username: string, options: ProductOptions }) {

    const { data: session } = useSession()
    const user = session?.user
    const pathname = usePathname()
    const router = useRouter()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="Open menu" className={"h-[95%] p-2 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-200 outline-none border-none  focus-visible:ring-0"}>
                    <LucideMoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
           <Link href={`/product/${product.slug}`}>
                    <DropdownMenuItem >
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Product</span>
                    </DropdownMenuItem>
                </Link>
                {product?.fileLink && !options.boughtProducts && <Link href={`/${username}/products/edit/${product.slug}`}>
                    <DropdownMenuItem >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                </Link>}
                {product?.fileLink && options.boughtProducts && 
                    <DropdownMenuItem className="text-yellow-400 hover:text-yellow-800"
                    onClick={() => {
                        router.push("/" + username + "/bought-products?tid=" + product.transactionId );
                        showTransactionDetails(product, pathname)}}
                    >
                        <ListCollapseIcon className="mr-2 h-4 w-4" />
                        <span>Transaction</span>
                       
                    </DropdownMenuItem>
                }

                {(user && (user?.role === "admin" )) && !options.boughtProducts && <DropdownMenuItem asChild>
                    <div onClick={() => {
                        confirmDelete(product)
                    }} className="flex items-center text-red-600 hover:text-red-800">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Product
                    </div>
                </DropdownMenuItem>}
                {product?.fileLink && (
                    <DropdownMenuItem asChild>
                      { product?.fileLink ?
                        <div
                            onClick={async () => await downloadLink(product.fileLink + "")}
                            className="flex items-center text-green-400 hover:text-green-800 cursor-pointer"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Product
                        </div> : "" }
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
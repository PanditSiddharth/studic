"use client"
import { IProduct } from "@/modals/product.model";
import { getPublishedProduct, getPublishedProducts } from "@/server-functions/product";
import { create } from "zustand";

interface ProductsStore {
    products: IProduct[];
    product: IProduct;
    page: number;
    totalProducts: number;
    increasePage: () => void;
    getProducts(arg0: { username?: string, page: number, postsPerPage?: number, boughtProducts?: boolean
        category?: string, search?: string;
     }, isInfiniteScroll?: boolean): Promise<void>;
    getProduct: (slug: string) => Promise<void | false>
}
const useProductsStore = create<ProductsStore>((set) => ({
    products: [],
    page: 1,
    totalProducts: 0,
    product: {} as IProduct,
    getProduct: async (slug) => {
        try {
            const res = await getPublishedProduct(slug);
            if ("error" in res) {
                set({ product: {} as IProduct });
                return false;
            }
            set({ product: res.product as IProduct });
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    },
    getProducts: async (o, isInfiniteScroll = false) => {
        const pageSize = o?.postsPerPage || 20
        const skip = isInfiniteScroll ? (o.page - 1) * pageSize : 0
        try {
            const res = await getPublishedProducts({
                skip,
                postsPerPage: pageSize,
                search: o?.search,
                tag: o?.category,
            })
            if ("error" in res) return
            set((state) => ({
                products: isInfiniteScroll ? [...state.products, ...(res.products as IProduct[])] : (res.products as IProduct[]),
                totalProducts: res.totalProducts,
                page: o.page,
            }))
        } catch (error) {
            console.error(error);
        }
    },
    increasePage: () => set((state) => ({ page: state.page + 1 })),
}))


export default useProductsStore

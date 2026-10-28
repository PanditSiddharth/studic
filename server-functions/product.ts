"use server"
import connectDB from "@/connectDB";
import { IProduct, ProductModel } from "@/modals/product.model";
import { getSessionUser } from "./user";
import { IOrder, OrderModel } from "@/modals/order.model";
import { err, productFilter } from "@/helpers";
import mongoose from "mongoose";

interface GetProductOptions {
    skip: number
    postsPerPage?: number
    search?: string
    searchBy?: string
}

interface ResProps {
    products: IProduct[];
    totalProducts: number;
}

export async function getProductsFromServer(options: GetProductOptions): Promise<ResProps | {error: string}> {
    await connectDB()
    const user = await getSessionUser()

    try {
        options.postsPerPage = options.postsPerPage || 20
        const or = [
            { title: { $regex: options.search || "", $options: "i" } },
            { description: { $regex: options.search || "", $options: "i" } },
            { tags: { $regex: options.search || "", $options: "i" } },
        ]
            // Fetch products with search and pagination
           let products = await ProductModel.find({
                $or: or,
            })
                .sort({ _id: -1 })
                .skip(options.skip)
                .limit(options.postsPerPage);

            const totalProducts = await ProductModel.countDocuments({
                $or: or,
            });
        
            if (!user || user && user._id != products[0]?.seller) {
                products = products.map((product: IProduct) => {
                    product.fileLink = undefined;
                    return product
                })
            }
        return JSON.parse(JSON.stringify({ products, totalProducts }));
    } catch (error: any) {
       return err(error, "f", {ret: error.message})
    }
}

export async function getProductFromServer(productId: string): Promise<IProduct | false> {
    await connectDB()
    try {
        const product = await ProductModel.findById(productId);
        if (!product) return false
        const user = await getSessionUser()

        if (user?.role != "admin" && product.seller != user?._id)
            product.fileLink = null

        return JSON.parse(JSON.stringify(product));
    } catch (error) {
        console.error(error);
        return false
    }
}

// completed
export async function addOrUpdateProducts(data: Partial<IProduct> | Partial<IProduct>[]): Promise<IProduct[] | { error: string }> {
    try {
        await connectDB()
        const user = await getSessionUser()
        if (!user) return { error: "Please Login first" }
        const arrData = Array.isArray(data) ? data : [data]
        const options = { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true };
        const results = await Promise.all(arrData.map(async (productData) => {
            const id = productData._id && mongoose.isValidObjectId(productData._id)
                ? productData._id
                : new mongoose.Types.ObjectId();
            const existing = productData._id ? await ProductModel.findById(id).select("seller") : null;
            if (existing && user.role !== "admin" && String(existing.seller) !== String(user._id)) {
                return { error: "You can only update your own products" };
            }
            const safeData: Partial<IProduct> = { ...productData };
            delete safeData._id;
            if (!existing || user.role !== "admin") safeData.seller = user._id;
            const product = await ProductModel.findOneAndUpdate({ _id: id }, safeData, options);
            if (!product) return { error: "Something went wrong in updating product server side" }
            return productFilter(product)
        }));

        if (results.some(result => 'error' in result))
            return { error: "Some products failed to update/add" }
        return results as IProduct[]
    } catch (error: any) {
        return err(error, "f", { ret: error.message })
    }
}

// completed
export async function deleteProducts(productIds: string | string[]) {
    const user = await getSessionUser()
    if (!user || user.role != "admin") return { error: "Please Login first as admin" }
    try {
        const pdIdArray = Array.isArray(productIds) ? productIds : [productIds]
        await connectDB()
        const res = await ProductModel.deleteMany({ _id: { $in: pdIdArray } })
        return {success: res.acknowledged, deletedCount: res.deletedCount}
    } catch (error: any) {
        return err(error, "f", {ret: error.message});
    }
}

export async function getOrder(transactionId: string): Promise<Record<string, IOrder> | false> {
    await connectDB()
    try {
        const order = await OrderModel.findOne({ transactionId }).populate("product");
        if (!order) return false

        const { product, ...others } = order;

        return JSON.parse(JSON.stringify({ ...product._doc, ...others._doc }));
    } catch (error) {
        console.error(error);
        return false
    }
}

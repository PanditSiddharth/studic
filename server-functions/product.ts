"use server"
import connectDB from "@/connectDB";
import { IProduct, ProductModel } from "@/modals/product.model";
import { getSessionUser } from "./user";
import { IOrder, OrderModel } from "@/modals/order.model";
import { err, productFilter } from "@/helpers";
import { getItemAccess } from "./library";
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

export async function getProductFromServer(productId: string): Promise<IProduct | false> {    await connectDB()
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
        console.error(error);
        return { error: error?.message || "Could not save this product" };
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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Strip the paid file URL before sending a product to a public page. */
const toPublicProduct = (product: any): Partial<IProduct> => {
    // Mongoose documents keep schema fields behind getters, so spreading them
    // directly produces an empty object. Convert to a plain object first.
    const plain = product && typeof product.toObject === "function" ? product.toObject() : product;
    const filtered = productFilter(plain);
    delete (filtered as { fileLink?: string }).fileLink;
    return filtered;
};

interface PublicProductsOptions {
    skip?: number;
    postsPerPage?: number;
    /** Free text matched against title, description and tags. */
    search?: string;
    tag?: string;
}

/**
 * Products added before the status field existed have no `status` key. They were
 * already public on the old product showcase, so keep them visible instead of
 * hiding the whole catalogue after the status filter was introduced.
 */
const PUBLIC_PRODUCT_STATUS = { $or: [{ status: "published" }, { status: { $exists: false } }] };

const publicProductQuery = (extra: Record<string, unknown> = {}) => ({
    $and: [PUBLIC_PRODUCT_STATUS, extra],
});

/** Published products, used by /products, the home page and related items. */
export async function getPublishedProducts(options: PublicProductsOptions = {}) {
    try {
        await connectDB();
        const skip = Math.max(0, Number(options.skip) || 0);
        const limit = Math.min(48, Math.max(1, Number(options.postsPerPage) || 12));
        const search = String(options.search || "").trim();
        const tag = String(options.tag || "").trim();

        const extra: Record<string, unknown> = {};
        if (search) {
            const regex = { $regex: escapeRegex(search), $options: "i" };
            extra.$or = [{ title: regex }, { description: regex }, { tags: regex }];
        }
        if (tag) extra.tags = tag;

        const query = publicProductQuery(extra);

        const [products, totalProducts] = await Promise.all([
            ProductModel.find(query)
                .sort({ publishedAt: -1, createdOn: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            ProductModel.countDocuments(query),
        ]);

        return JSON.parse(JSON.stringify({
            products: products.map(toPublicProduct),
            totalProducts,
        }));
    } catch (error: any) {
        console.error("Error loading published products", error);
        return { error: error?.message || "Could not load products" };
    }
}

export interface ProductOption {
    _id: string;
    title: string;
    slug: string;
    status?: string;
    price?: number;
    thumbnail?: string;
}

/**
 * Compact list of every product, including drafts, for admin pickers such as
 * the "related products" field on the article form. Admins only.
 */
export async function getProductOptions(): Promise<ProductOption[]> {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "admin") return [];
        await connectDB();
        const products = await ProductModel.find({})
            .select("title slug status price thumbnail")
            .sort({ title: 1 })
            .limit(500)
            .lean();
        return products.map((product: any) => ({
            _id: String(product._id),
            title: product.title || "Untitled product",
            slug: product.slug || "",
            status: product.status,
            price: product.price,
            thumbnail: product.thumbnail,
        }));
    } catch (error) {
        console.error("Error loading product options", error);
        return [];
    }
}

/**
 * Public product detail with the seller card, access state for the current
 * visitor and a few related items.
 */
export async function getPublishedProduct(slug: string) {
    if (!slug) return { error: "This product could not be found" };
    try {
        await connectDB();
        const product = await ProductModel.findOne(publicProductQuery({ slug }))
            .populate("seller", "name username image");
        if (!product) return { error: "This product could not be found" };

        const access = await getItemAccess({ productId: String(product._id) });
        const data = toPublicProduct(product);
        const seller = (product as any).seller;
        (data as { seller?: unknown }).seller = seller && typeof seller === "object"
            ? { _id: String(seller._id), name: seller.name, username: seller.username, image: seller.image }
            : undefined;
        (data as { tags?: string[] }).tags = (product.tags as string[]) || [];

        const tags = Array.isArray(product.tags) ? product.tags : [];
        let related: any[] = tags.length
            ? await ProductModel.find(publicProductQuery({ _id: { $ne: product._id }, tags: { $in: tags } }))
                .sort({ publishedAt: -1, createdOn: -1 })
                .limit(4)
            : [];
        if (related.length < 3) {
            const filler = await ProductModel.find(publicProductQuery({ _id: { $ne: product._id } }))
                .sort({ publishedAt: -1, createdOn: -1 })
                .limit(4);
            const seen = new Set(related.map((item) => String(item._id)));
            related = [...related, ...filler.filter((item) => !seen.has(String(item._id)))].slice(0, 4);
        }

        return JSON.parse(JSON.stringify({
            product: data,
            access,
            related: related.map(toPublicProduct),
        }));
    } catch (error: any) {
        console.error("Error loading product", error);
        return { error: error?.message || "Could not load this product" };
    }
}

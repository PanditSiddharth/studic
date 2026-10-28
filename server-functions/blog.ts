"use server"
import connectDB from "@/connectDB";
import { BlogModel, IBlog } from "@/modals/blog.model";
import { getSessionUser } from "./user";
import mongoose from "mongoose";
import { blogFilter, normalizeBlogCategories } from "@/helpers";

export const addOrUpdateBlog = async (blog: Partial<IBlog>): Promise<Partial<IBlog> | { error: string }> => {
    try {
        await connectDB();
        const user = await getSessionUser();
        if (!user || user.role !== "admin") return { error: "Administrator access required" };

        const options = { new: true, upsert: true, setDefaultsOnInsert: true };
        const product = await BlogModel.findOneAndUpdate(
            { _id: blog._id || new mongoose.Types.ObjectId() },
            blog, options
        );

        if (!product) return { error: "Something went wrong in processing the blog" };
        return blogFilter(product)
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not save this blog" };
    }
};

interface GetBlogOptions {
    products?: boolean;
    slug?: string;
    _id?: string;
    category?: string;
}
export async function getBlog(opt: GetBlogOptions = {}): Promise<Partial<IBlog> | { error: string }> {
    if (!opt?.slug && !opt?._id)
        return { error: "Invalid Url" }

    await connectDB()
    try {
        let query: any = {}
        if (opt?.slug)
            query = { slug: opt?.slug }
        else if (opt?._id)
            query = { _id: opt?._id }
        else return { error: "Slug or _id is required" }
        let blog: any;
        if (opt.products)
            blog = await BlogModel.findOne(query).populate({
                path: "products",
                // Legacy products were saved before the status field existed and
                // are still public, so include anything that is not explicitly
                // draft/archived.
                match: { $or: [{ status: "published" }, { status: { $exists: false } }] },
                select: "title slug thumbnail description price currency tags status",
            }) as IBlog;
        else
            blog = await BlogModel.findOne(query) as IBlog;

        if (!blog) return { error: "No blog found" }
        if (opt?.category) {
            const categories = normalizeBlogCategories(blog.category);
            if (!categories.includes(opt.category.trim().toLowerCase()))
                return { error: "No blog found" }
        }

        return blogFilter(blog);
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load this blog" };
    }
}

interface GetBlogsOptions {
    ids?: any[];
    skip?: number;
    postsPerPage?: number
    search?: string
    searchBy?: string
    /** Public pages should never list drafts or private articles. */
    publicOnly?: boolean
    category?: string
}

interface ResProps {
    blogs: IBlog[];
    totalBlogs: number;
}

export async function getBlogs(options: GetBlogsOptions): Promise<ResProps | { error: string }> {
    await connectDB()

    try {
        if (!options?.ids) {
            options.postsPerPage = options.postsPerPage || 20
            const search = String(options.search || "").trim()
            const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
            const query: Record<string, any> = {
                $or: [{ title: regex }, { description: regex }, { tags: regex }],
            }
            if (options.publicOnly) query.status = { $in: ["public", "unlisted", "free", "paid"] }
            if (options.category) query.category = options.category.trim().toLowerCase()

            // Fetch blogs with search and pagination
            const [blogs, totalBlogs] = await Promise.all([
                BlogModel.find(query)
                    .sort({ publishedAt: -1, _id: -1 })
                    .skip(Math.max(0, Number(options.skip) || 0))
                    .limit(Math.min(48, Math.max(1, Number(options.postsPerPage) || 20))),
                BlogModel.countDocuments(query),
            ]);

            return JSON.parse(JSON.stringify({
                blogs: blogs.map((blog) => {
                    const plain = blog.toObject();
                    return { ...plain, category: normalizeBlogCategories(plain.category) };
                }),
                totalBlogs,
            }));
        } else {
            return {
                blogs: JSON.parse(JSON.stringify(
                    await BlogModel.find({ _id: { $in: options.ids } }),
                )),
                totalBlogs: options.ids?.length
            }
        }
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load blogs" };
    }
}
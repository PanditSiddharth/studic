"use server"
import connectDB from "@/connectDB";
import { BlogModel, IBlog } from "@/modals/blog.model";
import { getSessionUser } from "./user";
import mongoose from "mongoose";
import { blogFilter, err } from "@/helpers";
import { MdOutlineQueryBuilder } from "react-icons/md";

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
        return err(error, "f", { ret: error.message });
    }
};

interface GetBlogOptions {
    products?: boolean;
    slug?: string;
    _id?: string;
    category?: string;
}
export async function getBlog(opt: GetBlogOptions = {}): Promise<Partial<IBlog> | { error: string }> {
    if (!opt?.slug)
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
            blog = await BlogModel.findOne(query).populate("products") as IBlog;
        else
            blog = await BlogModel.findOne(query) as IBlog;

        if (!blog) return { error: "No blog found" }
        if (opt?.category && Array.isArray(blog.category)) {
            if (!blog.category.includes(opt?.category.trim()?.toLowerCase()))
                return { error: "No blog found" }
        }

        return blogFilter(blog);
    } catch (error: any) {
        return err(error, "f", { ret: error.message });
    }
}

interface GetBlogsOptions {
    ids?: any[];
    skip?: number;
    postsPerPage?: number
    search?: string
    searchBy?: string
}

interface ResProps {
    blogs: IBlog[];
    totalBlogs: number;
}

export async function getBlogs(options: GetBlogsOptions): Promise<ResProps | { error: string }> {
    await connectDB()
    const user = await getSessionUser()

    try {
        if (!options?.ids) {
            options.postsPerPage = options.postsPerPage || 20
            const or = [
                { title: { $regex: options.search || "", $options: "i" } },
                { description: { $regex: options.search || "", $options: "i" } },
                { tags: { $regex: options.search || "", $options: "i" } },
            ]
            // Fetch blogs with search and pagination
            const blogs = await BlogModel.find({
                $or: or,
            })
                .sort({ _id: -1 })
                .skip(options.skip || 0)
                .limit(options.postsPerPage);

            const totalBlogs = await BlogModel.countDocuments({
                $or: or,
            });

            return JSON.parse(JSON.stringify({ blogs, totalBlogs }));
        } else {
            return {
                blogs: JSON.parse(JSON.stringify(
                    await BlogModel.find({ _id: { $in: options.ids } }),
                )),
                totalBlogs: options.ids?.length
            }
        }
    } catch (error: any) {
        return err(error, "f", { ret: error.message })
    }
}
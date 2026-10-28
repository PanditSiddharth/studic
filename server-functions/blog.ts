"use server"
import connectDB from "@/connectDB";
import { BlogModel, IBlog } from "@/modals/blog.model";
import { CourseModel } from "@/modals/course.model";
import { getSessionUser } from "./user";
import mongoose from "mongoose";
import { blogFilter, isHiddenBlogStatus, isPaidBlog, normalizeBlogCategories } from "@/helpers";
import { getItemAccess } from "./library";

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

export interface BlogAccessState {
    signedIn: boolean;
    owned: boolean;
    enrolled: boolean;
    orderStatus: string | null;
    orderId: string | null;
    progressPercent: number;
}

export interface BlogCourseSummary {
    _id?: string;
    title?: string;
    slug?: string;
    thumbnail?: string;
    description?: string;
    price?: number;
    currency?: string;
    accessType?: string;
}

export interface BlogResult extends Partial<IBlog> {
    locked?: boolean;
    access?: BlogAccessState;
    accessCourse?: BlogCourseSummary;
    relatedBlogs?: Pick<IBlog, "_id" | "title" | "slug" | "thumbnail" | "description">[];
}

export async function getBlog(opt: GetBlogOptions = {}): Promise<BlogResult | { error: string }> {
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

        const user = await getSessionUser();
        const isAdmin = user?.role === "admin";

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

        // Private and draft articles are invisible everywhere, including direct
        // links. Only administrators can preview them (e.g. from the editor).
        if (!isAdmin && isHiddenBlogStatus(blog.status))
            return { error: "No blog found" };

        if (opt?.category) {
            const categories = normalizeBlogCategories(blog.category);
            if (!categories.includes(opt.category.trim().toLowerCase()))
                return { error: "No blog found" }
        }

        const result = blogFilter(blog) as BlogResult;
        const accessCourse = await findAccessCourse(blog);
        const relatedSearch = String(blog.tags?.[0] || blog.category?.[0] || blog.title?.split(" ")[0] || "").trim();
        const relatedRegex = relatedSearch
            ? { $regex: relatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
            : null;
        const relatedBlogs = await BlogModel.find({
            _id: { $ne: blog._id },
            status: { $in: ["public", "free", "paid"] },
            ...(relatedRegex ? { $or: [{ title: relatedRegex }, { description: relatedRegex }, { tags: relatedRegex }] } : {}),
        })
            .select("_id title slug thumbnail description")
            .sort({ publishedAt: -1, _id: -1 })
            .limit(4)
            .lean();

        // A paid article is readable when the visitor bought it, is enrolled in
        // a course that includes it, or is an administrator. Otherwise only the
        // summary is returned so the page can show a purchase/unlock card.
        if (!isAdmin && isPaidBlog(blog)) {
            const access = await getItemAccess({ blogId: String(blog._id) });
            if (!access.owned) {
                return JSON.parse(JSON.stringify({
                    ...result,
                    content: "",
                    locked: true,
                    access,
                    accessCourse,
                    relatedBlogs,
                }));
            }
        }

        return JSON.parse(JSON.stringify({ ...result, accessCourse, relatedBlogs }));
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load this blog" };
    }
}

/** Pick the course a locked article belongs to, for the "unlock with course" card. */
async function findAccessCourse(blog: any): Promise<BlogCourseSummary | undefined> {
    const select = "title slug thumbnail description price currency accessType";
    const course = blog.course
        ? await CourseModel.findOne({ _id: blog.course, status: { $in: ["published", "unlisted"] } }).select(select).lean()
        : await CourseModel.findOne({ content: blog._id, status: { $in: ["published", "unlisted"] } }).select(select).lean();
    if (!course) return undefined;
    return JSON.parse(JSON.stringify(course));
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
        const user = await getSessionUser();
        const isAdmin = user?.role === "admin";
        // Admin pickers can request drafts; every other caller only ever sees
        // listed (public/paid/free) articles. Unlisted stays link-only.
        const publicOnly = Boolean(options.publicOnly) || !isAdmin;

        if (!options?.ids) {
            options.postsPerPage = options.postsPerPage || 20
            const search = String(options.search || "").trim()
            const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
            const clauses: Record<string, any>[] = []
            if (publicOnly) {
                clauses.push({ $or: [
                    { status: { $in: ["public", "free", "paid"] } },
                    { status: { $exists: false } },
                ] })
            }
            if (search) {
                clauses.push({ $or: [{ title: regex }, { description: regex }, { tags: regex }] })
            }
            if (options.category) clauses.push({ category: options.category.trim().toLowerCase() })
            const query: Record<string, any> = clauses.length ? { $and: clauses } : {}

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
            const query: Record<string, any> = { _id: { $in: options.ids } }
            if (publicOnly) query.status = { $in: ["public", "free", "paid"] }
            return {
                blogs: JSON.parse(JSON.stringify(
                    await BlogModel.find(query),
                )),
                totalBlogs: options.ids?.length
            }
        }
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load blogs" };
    }
}
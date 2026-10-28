"use server"
import connectDB from "@/connectDB";
import { CourseModel, ICourse } from "@/modals/course.model";
import { BlogModel } from "@/modals/blog.model";
import { getSessionUser } from "./user";
import mongoose from "mongoose";
import { courseFilter, blogFilter, isHiddenBlogStatus, isPaidBlog } from "@/helpers";
import { getItemAccess } from "./library";

export const addOrUpdateCourse = async (course: Partial<ICourse>): Promise<Partial<ICourse> | { error: string }> => {
    try {
        await connectDB();
        const user = await getSessionUser();
        if (!user || user.role !== "admin") return { error: "Administrator access required" };

        const options = { new: true, upsert: true, setDefaultsOnInsert: true };
        const courseRes = await CourseModel.findOneAndUpdate(
            { _id: course._id || new mongoose.Types.ObjectId() },
            course, options
        );

        if (!courseRes) return { error: "Something went wrong in processing the course" };
        return courseFilter(courseRes)
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not save this course" };
    }
};

interface GetCourseOptions{
    blogs?: boolean;
    products?: boolean;
    slug?: string;
    _id?: string;
}

export async function getCourse(options: GetCourseOptions): Promise<Partial<ICourse> | {error: string}> {
    if(!options)
        return {error: "Invalid Url"}
    await connectDB()
    try {
        let course: any;
        let query: any
        if(options.slug)
            query = { slug: options.slug }
        else if(options?._id)
            query = { _id: options._id }
        else return {error: "Slug or _id is required"}

        const user = await getSessionUser();
        const isAdmin = user?.role === "admin";

        course = await CourseModel.findOne(query)
        if (!course) return {error: "No course found"}

        // Draft/private/archived courses are hidden from visitors, even when
        // they have the direct link. Unlisted remains link-only.
        if (!isAdmin && ["draft", "private", "archived"].includes(String(course.status)))
            return {error: "No course found"}

        if(options?.blogs)
            await course.populate({
                path: "content",
                // Private and draft articles must not surface inside a course.
                match: isAdmin ? undefined : { status: { $nin: ["draft", "private"] } },
                select: "title description thumbnail slug status accessType price currency",
            });

        if(options?.products)
            await course.populate({
                path: "products",
                match: isAdmin ? undefined : { $or: [{ status: "published" }, { status: { $exists: false } }] },
                select: "title slug thumbnail description price currency tags status fileName fileSize",
            });

        return courseFilter(course);
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load this course" };
    }
}

interface GetCourseLessonOptions {
    courseSlug?: string;
    lessonSlug?: string;
}

/**
 * Loads one lesson for a course, enforcing access on the server. Paid course
 * lessons are only returned once the learner owns the course; otherwise the
 * response carries a locked summary without the article body.
 */
export async function getCourseLesson(options: GetCourseLessonOptions) {
    if (!options?.courseSlug || !options?.lessonSlug)
        return { error: "Invalid lesson link" };

    await connectDB();

    try {
        const user = await getSessionUser();
        const isAdmin = user?.role === "admin";

        const course = await CourseModel.findOne({ slug: options.courseSlug })
            .populate("content", "title description thumbnail slug status")
            .populate({
                path: "products",
                match: { $or: [{ status: "published" }, { status: { $exists: false } }] },
                select: "title slug thumbnail description price currency status fileName",
            }) as ICourse;

        if (!course) return { error: "This course could not be found" };
        if (!isAdmin && !["published", "unlisted"].includes(String(course.status)))
            return { error: "This course is not available" };

        const lessonIds = new Set(
            (Array.isArray(course.content) ? course.content : [])
                .map((item: any) => String(item?._id ?? item ?? ""))
                .filter(Boolean)
        );

        const lesson = await BlogModel.findOne({ slug: options.lessonSlug }).populate({
            path: "products",
            match: { $or: [{ status: "published" }, { status: { $exists: false } }] },
            select: "title slug thumbnail description price currency tags status",
        });

        if (!lesson || !lessonIds.has(String(lesson._id)))
            return { error: "This lesson is not part of the course" };

        // A private/draft article stays hidden even when it is attached to a course.
        if (!isAdmin && isHiddenBlogStatus(lesson.status))
            return { error: "This lesson is not available" };

        const access = await getItemAccess({ courseId: String(course._id) });
        const blogAccess = await getItemAccess({ blogId: String(lesson._id) });
        const isPaid = course.accessType !== "free" && Number(course.price) > 0;
        const lessonPaid = isPaidBlog(lesson);
        const summary = {
            _id: String(lesson._id),
            title: lesson.title,
            slug: lesson.slug,
            thumbnail: lesson.thumbnail,
            description: lesson.description,
        };

        const locked = !isAdmin && (
            (isPaid && !access.owned) ||
            (lessonPaid && !access.owned && !blogAccess.owned)
        );

        if (locked) {
            return JSON.parse(JSON.stringify({
                locked: true,
                course: courseFilter(course),
                access,
                lesson: summary,
            }));
        }

        return JSON.parse(JSON.stringify({
            locked: false,
            course: courseFilter(course),
            access,
            lesson: summary,
            blog: blogFilter(lesson),
        }));
    } catch (error: any) {
        console.error("Error loading course lesson", error);
        return { error: error?.message || "Could not load this lesson" };
    }
}

interface GetCoursesOptions {
    skip: number
    postsPerPage?: number
    search?: string
    searchBy?: string
    level?: string
    accessType?: "free" | "paid"
    /** Admin screens can request drafts; public pages only ever see published courses. */
    includeUnpublished?: boolean
}

interface ResProps {
    courses: ICourse[];
    totalCourses: number;
}

const escapeSearchRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getCourses(options: GetCoursesOptions): Promise<ResProps | {error: string}> {
    await connectDB()
    try {
        const skip = Math.max(0, Number(options?.skip) || 0)
        const limit = Math.min(48, Math.max(1, Number(options?.postsPerPage) || 20))
        const search = String(options?.search || "").trim()

        const query: Record<string, any> = {}
        if (!options?.includeUnpublished) query.status = "published"

        if (search) {
            const regex = { $regex: escapeSearchRegex(search), $options: "i" }
            query.$or = [{ title: regex }, { description: regex }, { tags: regex }]
        }

        if (options?.level && options.level !== "all") query.level = options.level

        if (options?.accessType === "free") {
            query.$and = [{ $or: [{ accessType: "free" }, { price: 0 }] }]
        } else if (options?.accessType === "paid") {
            query.$and = [{ $or: [{ accessType: "paid" }, { price: { $gt: 0 } }] }]
        }

        const [courses, totalCourses] = await Promise.all([
            CourseModel.find(query)
                .sort({ publishedAt: -1, createdOn: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            CourseModel.countDocuments(query),
        ])

        return JSON.parse(JSON.stringify({ courses, totalCourses }));
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load courses" };
    }
}
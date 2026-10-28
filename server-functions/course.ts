"use server"
import connectDB from "@/connectDB";
import { CourseModel, ICourse } from "@/modals/course.model";
import { BlogModel } from "@/modals/blog.model";
import { getSessionUser } from "./user";
import mongoose from "mongoose";
import { courseFilter, err } from "@/helpers";

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
        return err(error, "f", { ret: error.message });
    }
};

interface GetCourseOptions{
    blogs?: boolean;
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
        if(options?.blogs)
        course = await CourseModel.findOne(query).populate("content", 
            "title description thumbnail slug") as ICourse;
        else 
        course = await CourseModel.findOne(query)

        if (!course) return {error: "No course found"}
        return courseFilter(course);
    } catch (error: any) {
        return err(error, "f", {ret: error.message});
    }
}

interface GetCoursesOptions {
    skip: number
    postsPerPage?: number
    search?: string
    searchBy?: string
}

interface ResProps {
    courses: ICourse[];
    totalCourses: number;
}

export async function getCourses(options: GetCoursesOptions): Promise<ResProps | {error: string}> {
    await connectDB()
    const user = await getSessionUser()

    try {
        options.postsPerPage = options.postsPerPage || 20
        const or = [
            { title: { $regex: options.search || "", $options: "i" } },
            { description: { $regex: options.search || "", $options: "i" } },
            { tags: { $regex: options.search || "", $options: "i" } },
        ]
            // Fetch courses with search and pagination
           const courses = await CourseModel.find({
                $or: or,
            })
                .sort({ _id: -1 })
                .skip(options.skip)
                .limit(options.postsPerPage);

            const totalCourses = await CourseModel.countDocuments({
                $or: or,
            });
        
        return JSON.parse(JSON.stringify({ courses, totalCourses }));
    } catch (error: any) {
       return err(error, "f", {ret: error.message})
    }
}
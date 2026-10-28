"use server"
import connectDB from "@/connectDB"
import { IQuery, QueryModel } from "@/modals/query.model";
import { getSessionUser } from "./user";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const queryInputSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    description: z.string().trim().min(1).max(10000),
});

export const createQuery = async (data: Partial<IQuery>) => {
    try {
        const parsed = queryInputSchema.safeParse(data);
        if (!parsed.success) return { error: "Please provide a valid name, email and message." };
        const limiter = rateLimit(`query:${parsed.data.email.toLowerCase()}`, 3, 60 * 60 * 1000);
        if (!limiter.allowed) return { error: "Too many messages. Please try again later." };
        await connectDB();
        const { name, email, description } = parsed.data;
        const newData = await QueryModel.create({ name, email, description });
        if (newData && newData.email)
            return { success: true }
        else
            return { error: "Error creating Query" }
    } catch (error) {
        return { error: "Error creating query" }
    }
}

export const deleteQuery = async (queryId: string) => {
    try {
        await connectDB();
        const user = await getSessionUser()
        if (!user || user.role != "admin") {
            return { error: "Only admin can delete queries." }
        }
        const newData = await QueryModel.deleteOne({ _id: queryId });
        return {success: true};
    } catch (error) {
        return { error: "Error in deleting query" }
    }
}

export const getQueries = async () => {
    try {
        await connectDB();
        const user = await getSessionUser()
        if (!user || user.role != "admin") {
            return { error: "Only admin can see queries." }
        }
        const newData = await QueryModel.find();
        if(newData)
            return JSON.parse(JSON.stringify(newData)) as IQuery[]
        return {error: "Something went wrong"}
    } catch (error) {
        return { error: "Error in deleting query" }
    }
}
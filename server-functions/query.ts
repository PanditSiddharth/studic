"use server"
import connectDB from "@/connectDB"
import { IQuery, QueryModel } from "@/modals/query.model";
import { getSessionUser } from "./user";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendChatMessage, startSupportChat } from "@/server-functions/chat";

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

export const createQueryAndSupportChat = async (data: Partial<IQuery>) => {
        const result = await createQuery(data);
        if (!result || "error" in result) return result || { error: "Could not save your message" };

        const user = await getSessionUser();
        if (!user?._id) {
            return {
                success: true,
                chatAvailable: false,
                message: "Your message was sent to support. Sign in to continue the conversation in chat.",
        }

        const chat = await startSupportChat();
        const chatId = "chatId" in chat ? String((chat as { chatId?: string }).chatId || "") : "";
        if ("error" in chat || !chatId) {
            console.error("Support query was saved but chat delivery failed", chat);
            return {
                success: true,
                chatAvailable: false,
                message: "Your message was saved. Chat is temporarily unavailable.",
            };
        }

        const sent = await sendChatMessage({
            chatId,
            text: `Contact form from ${data.name || "A learner"} (${data.email || "email not provided"})\n\n${data.description || ""}`,
        });
        if ("error" in sent) {
            console.error("Support query was saved but chat message delivery failed", sent);
            return {
                success: true,
                chatAvailable: false,
                message: "Your message was saved. Chat delivery is temporarily unavailable.",
            };
        }

        return { success: true, chatAvailable: true, chatId };
    };
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
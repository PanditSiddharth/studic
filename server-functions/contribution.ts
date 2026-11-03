"use server"
import connectDB from "@/connectDB";
import { ContributionModel, IContribution } from "@/modals/contribution.model";
import { BlogModel } from "@/modals/blog.model";
import { getSessionUser } from "./user";
import { isListedBlogStatus } from "@/helpers";
import mongoose from "mongoose";

export interface SubmitContributionInput {
    blogId: string;
    proposedContent: string;
    proposedTitle?: string;
    proposedDescription?: string;
}

export interface ContributionResult {
    _id?: string;
    blog?: { _id?: string; title?: string; slug?: string };
    submittedBy?: { _id?: string; name?: string; username?: string; image?: string };
    proposedTitle?: string;
    proposedDescription?: string;
    proposedContent?: string;
    status?: string;
    reviewComment?: string;
    submittedAt?: Date | string;
    reviewedAt?: Date | string;
}

interface ContributionQueue {
    pending: ContributionResult[];
    reviewed: ContributionResult[];
    stats: { pending: number; approved: number; rejected: number };
}

const MAX_CONTENT = 120000;

const contributorFields = "_id name username image";

const serialize = (value: any) => JSON.parse(JSON.stringify(value ?? null));

/**
 * A student proposes a full replacement for one article. The proposal is
 * stored unchanged; nothing is published until an administrator approves it.
 */
export const submitArticleContribution = async (
    input: SubmitContributionInput
): Promise<{ success: true } | { error: string }> => {
    try {
        const user = await getSessionUser();
        if (!user?._id) return { error: "Sign in to suggest an edit" };

        const proposedContent = String(input?.proposedContent || "").trim();
        if (proposedContent.length < 20) return { error: "The edit is too short to review" };
        if (proposedContent.length > MAX_CONTENT) return { error: "Keep the edit under 120,000 characters" };

        await connectDB();
        const blog = await BlogModel.findOne({ _id: input.blogId }).select("status content title description");
        if (!blog) return { error: "This article could not be found" };
        if (!isListedBlogStatus(blog.status) && blog.status !== "unlisted")
            return { error: "This article does not accept edits" };

        const currentContent = String(blog.content || "").trim();
        if (proposedContent === currentContent)
            return { error: "Nothing changed — edit the article before submitting" };

        // One open proposal per student per article: supersede the previous one.
        await ContributionModel.updateMany(
            { blog: blog._id, submittedBy: user._id, status: "pending" },
            { $set: { status: "rejected", reviewComment: "Superseded by a newer proposal from the same student", reviewedAt: new Date() } }
        );

        const proposedTitle = String(input?.proposedTitle || "").trim();
        const proposedDescription = String(input?.proposedDescription || "").trim();

        const contribution = await ContributionModel.create({
            blog: blog._id,
            submittedBy: user._id,
            proposedTitle: proposedTitle && proposedTitle !== blog.title ? proposedTitle : undefined,
            proposedDescription: proposedDescription && proposedDescription !== blog.description ? proposedDescription : undefined,
            proposedContent,
        });
        if (!contribution) return { error: "The edit could not be submitted" };

        return { success: true };
    } catch (error: any) {
        console.error("Error submitting contribution", error);
        return { error: error?.message || "Could not submit this edit" };
    }
};

/** The signed-in student's own submissions, newest first. */
export const getMyContributions = async (): Promise<ContributionResult[] | { error: string }> => {
    try {
        const user = await getSessionUser();
        if (!user?._id) return { error: "Sign in to see your contributions" };
        await connectDB();

        const contributions = await ContributionModel.find({ submittedBy: user._id })
            .populate("blog", "title slug")
            .sort({ submittedAt: -1 })
            .limit(30);
        return serialize(contributions);
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load your contributions" };
    }
};

/** Whether the signed-in student already has a proposal waiting on one article. */
export const getMyArticleContribution = async (
    blogId: string
): Promise<Pick<ContributionResult, "status" | "submittedAt" | "reviewComment"> | null> => {
    try {
        const user = await getSessionUser();
        if (!user?._id) return null;
        if (!blogId || !mongoose.isValidObjectId(blogId)) return null;
        await connectDB();

        const contribution = await ContributionModel.findOne({ blog: blogId, submittedBy: user._id })
            .sort({ submittedAt: -1 })
            .select("status submittedAt reviewComment");
        return contribution ? serialize(contribution) : null;
    } catch (error) {
        console.error("Error loading article contribution", error);
        return null;
    }
};

/** Admin review queue: every pending proposal plus the recently reviewed ones. */
export const getContributionQueue = async (): Promise<ContributionQueue | { error: string }> => {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "admin") return { error: "Administrator access required" };
        await connectDB();

        const populate = [
            { path: "blog", select: "title slug content status" },
            { path: "submittedBy", select: contributorFields },
            { path: "reviewedBy", select: contributorFields },
        ];

        const [pending, reviewed, approvedCount, rejectedCount, pendingCount] = await Promise.all([
            ContributionModel.find({ status: "pending" }).populate(populate).sort({ submittedAt: -1 }).limit(50).lean(),
            ContributionModel.find({ status: { $ne: "pending" } }).populate(populate).sort({ reviewedAt: -1 }).limit(20).lean(),
            ContributionModel.countDocuments({ status: "approved" }),
            ContributionModel.countDocuments({ status: "rejected" }),
            ContributionModel.countDocuments({ status: "pending" }),
        ]);

        return serialize({
            pending,
            reviewed,
            stats: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
        });
    } catch (error: any) {
        console.error(error);
        return { error: error?.message || "Could not load the review queue" };
    }
};

/**
 * Admin decision on one proposal. Approving applies the proposed fields to the
 * live article and records the student as a contributor on the article.
 * Rejecting keeps the article untouched.
 */
export const reviewArticleContribution = async (options: {
    _id: string;
    action: "approved" | "rejected";
    reviewComment?: string;
}): Promise<{ success: true } | { error: string }> => {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "admin") return { error: "Administrator access required" };
        if (!mongoose.isValidObjectId(options?._id)) return { error: "Invalid contribution" };
        if (!["approved", "rejected"].includes(options.action)) return { error: "Invalid action" };

        await connectDB();
        const contribution = await ContributionModel.findOne({ _id: options._id }).populate("blog", "title") as mongoose.HydratedDocument<IContribution>;
        if (!contribution) return { error: "This proposal no longer exists" };
        if (contribution.status !== "pending") return { error: "This proposal was already reviewed" };

        contribution.status = options.action;
        contribution.reviewedBy = user._id as unknown as mongoose.Types.ObjectId;
        contribution.reviewComment = String(options.reviewComment || "").trim() || undefined;
        contribution.reviewedAt = new Date();
        await contribution.save();

        if (options.action === "approved") {
            const blog: any = await BlogModel.findById(contribution.blog).select("title description content contributors");
            if (blog) {
                // Publish the approved proposal onto the live article…
                if (contribution.proposedTitle) blog.title = contribution.proposedTitle;
                if (contribution.proposedDescription) blog.description = contribution.proposedDescription;
                if (contribution.proposedContent) blog.content = contribution.proposedContent;
                // …and record the student as a contributor shown on the article.
                blog.contributors.addToSet(contribution.submittedBy);
                await blog.save();
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error reviewing contribution", error);
        return { error: error?.message || "Could not review this proposal" };
    }
};

"use server"
import { auth } from "@/auth";
import connectDB from "@/connectDB"
import { IUser, UserModel } from "@/modals/user.model"
import { randomUUID } from "crypto"
import { AnalyticsModel, IAnalytics } from "@/modals/analytics.model";
import { ProductModel } from "@/modals/product.model";
import { err, userFilter, isSuperAdminEmail } from "@/helpers";

const getQuery = (id: string) => id.startsWith("@") ? { username: id.slice(1) } :
    (id.includes("@") ? { email: id } : { _id: id })

export const checkExistingUser = async (id: string) => {
    try {
        await connectDB()
        const user = await UserModel.findOne(getQuery(id))
        if (user)
            return userFilter(user)

        return false
    } catch (error) {
        return err("Error checking user " + error, undefined, { ret: false });
    }
}

export const createUser = async (user: Partial<IUser>) => {
    try {
        await connectDB()
        const randomId = randomUUID().split("-")[1]
        const username = user.username ? user.username : randomId
        const newUser = await UserModel.create({ ...user, username })
        return userFilter(newUser)
    } catch (error) {
        return err("Error creating user " + error, undefined, { ret: false });
    }
}

export const deleteUser = async (id: string) => {
    try {
        await connectDB()
        const user = await getSessionUser()
        const query = getQuery(id)
        const key = Object.keys(query)[0]

        if (!user)
            return { error: "Not logged in" }

        if (user.role != "admin" || user[key as "email" | "_id" | "username"] != query[key as "email" | "_id" | "username"])
            return { error: "Unauthorized user" }

        if (user) {
            await UserModel.deleteOne(query)
            return { success: true }
        } else {
            return { error: "Not logged in" }
        }
    } catch (error) {
        console.error("Error creating user", error);
        return { error: (error as { message: string }).message }
    }
}

export const getSessionUser = async () => {
    const session = await auth()
    if (!session) {
        return null
    }
    else return session.user
}

export const updateUser = async (user: Partial<IUser>) => {
    try {
        const sUser = await getSessionUser()
        if (!sUser)
            return { error: "Not logged in" }

        const isAdmin = sUser.role === "admin"
        const canManageRoles = isAdmin && isSuperAdminEmail(sUser.email)

        let query: Record<string, unknown>
        if (isAdmin) {
            if (user?.email) query = { email: String(user.email).trim().toLowerCase() }
            else if (user._id) query = { _id: user._id }
            else return { error: "Provide email or _id" }
        } else {
            query = { _id: sUser._id }
        }

        // Only these fields can ever be written through this generic helper.
        // Role changes are reserved for the owner account and passwords are
        // handled by dedicated, hashed flows.
        const payload: Record<string, unknown> = {}
        for (const key of ["name", "username", "about", "phone", "image"] as const) {
            if (key in user) payload[key] = user[key]
        }
        if (canManageRoles && user.role) payload.role = user.role
        if (isAdmin && user.status) payload.status = user.status

        if (!Object.keys(payload).length)
            return { error: "Nothing to update" }

        await connectDB()

        const updatedUser = await UserModel.findOneAndUpdate(query, payload, { new: true, runValidators: true })
        if (!updatedUser)
            return { error: "User not found" }
        return userFilter(updatedUser)
    } catch (error) {
        console.error("Error updating user", error);
        return { error: (error as { message: string }).message }
    }
}

export const getSellers = async () => {
    const session = await auth()
    const userId = session?.user?._id || null
    try {
        await connectDB()
        const users = await UserModel.find({ role: "seller", _id: { $ne: userId } })
        return JSON.stringify(users)
    } catch (error) {
        console.error("Error getting users", error);
        return null
    }
}

export const getUserByUsername = async (username: string) => {
    const userlog = await getSessionUser()
    try {
        await connectDB()
        const user = await UserModel.findOne({ username })
        if (user) {
            if (!userlog || userlog.role != "admin" && username !== userlog?.username) {
                user.phone = undefined
                user.email = undefined
                user.ifsc = undefined
                user.account = undefined
            }


            return JSON.parse(JSON.stringify(user))
        }
        return null
    } catch (error) {
        console.error("Error getting user", error);
        return null
    }
}

export const getUsernameByProductId = async (productId: string) => {
    try {
        await connectDB()
        const product = await ProductModel.findOne({ _id: productId }).populate("seller")
        if (product)
            return product.seller.username
        else
            return null

    } catch (error) {
        console.error("Error getting user", error);
        return null
    }
}

interface SkipPageDataProp {
    skip: number
    postsPerPage: number
    username: string
    search?: string
    searchBy?: "name" | "username" | "about" | "userId"
}

interface ResProps {
    usersRes: IUser[];
    totalUsers: number;
}
export async function getUsersFromServer(skipPageData: SkipPageDataProp): Promise<ResProps | false> {
    await connectDB()

    try {
        let users;
        const { search, searchBy } = skipPageData;
        const currentUser = await getSessionUser()

        const searchRegex = search ? search?.replace("@", "") : "";
        const searchQuery = { $regex: searchRegex, $options: "i" };
        const query: { $or?: Array<Record<string, { $regex: string; $options: string }>> } = {};


        if (searchBy) {
            query.$or = [{ [searchBy]: searchQuery }];
        } else if (searchRegex) {
            query.$or = [
                { name: searchQuery },
                { username: searchQuery },
                { about: searchQuery },
                { userId: searchQuery },
            ];
        }

        if (currentUser && currentUser.role == 'admin') {
            users = await UserModel.find(query).sort({ _id: -1 })
                .skip(skipPageData.skip).limit(skipPageData.postsPerPage).populate("analytics");
        }
        else {
            users = await UserModel.find(query).sort({ _id: -1 })
                .skip(skipPageData.skip).limit(skipPageData.postsPerPage);
        }


        users = await Promise.all(users.map(async user => {
            user._doc.products = await ProductModel.countDocuments({ seller: user._id })
            user._doc.analytics = user?.analytics?._doc

            if (currentUser?.role != "admin") {
                user._doc.phone = undefined
                user._doc.email = undefined
                user._doc.ifsc = undefined
                user._doc.account = undefined
                user._doc.anlytics = undefined
            }
            return user._doc
        }))
        if (!users || users.length === 0) { return false }
        const count = await UserModel.countDocuments(query);

        const res = JSON.parse(JSON.stringify({ usersRes: users, totalUsers: count }));
        return res;

    } catch (error) {
        console.error(error);
        return false
    }
}

export const updateUserAnalytics = async (userId: string, data: Partial<IAnalytics>) => {
    try {
        const user = await getSessionUser()

        if (!user || user?.role != "admin")
            return { error: "Unauthorized user or not logged in" }

        await connectDB()
        const updated = await AnalyticsModel.updateOne({ userId }, data)
        if (updated.modifiedCount == 0)
            return { error: "Something went wrong in updating users data" }
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: (error as { message: string }).message }
    }
}


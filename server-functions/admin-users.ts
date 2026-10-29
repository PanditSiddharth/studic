"use server";

import connectDB from "@/connectDB";
import { UserModel } from "@/modals/user.model";
import { isSuperAdminEmail, userFilter } from "@/helpers";
import { hashPassword } from "./passwords";
import { getSessionUser } from "./user";
import { z } from "zod";

const adminInputSchema = z.object({
  name: z.string().trim().min(2, "Enter the admin's name").max(60, "Keep the name under 60 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Keep the password under 72 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number")
    .optional()
    .or(z.literal("")),
});

/** Admins list + whether the viewer is allowed to manage other admins. */
export async function getAdminManagementData() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Administrator access required" as const };

  try {
    await connectDB();
    const admins = await UserModel.find({ role: "admin" })
      .sort({ createdOn: 1 })
      .select("name email image role status createdOn lastLoginAt");

    return JSON.parse(JSON.stringify({
      admins: admins.map((admin) => userFilter(admin)),
      currentEmail: session.email || "",
      isSuperAdmin: isSuperAdminEmail(session.email),
    }));
  } catch (error: any) {
    console.error("Error loading admins", error);
    return { error: error?.message || "Could not load administrators" };
  }
}

/**
 * Create a new administrator, or promote an existing account to admin.
 * Restricted to the owner account (see isSuperAdminEmail).
 */
export async function createAdminAccount(input: { name?: string; email?: string; password?: string }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Administrator access required" };
  if (!isSuperAdminEmail(session.email)) return { error: "Only the owner account can create administrators" };

  const parsed = adminInputSchema.safeParse({
    name: input?.name,
    email: input?.email,
    password: input?.password || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the details" };

  try {
    await connectDB();
    const { name, email, password } = parsed.data;
    const existing = await UserModel.findOne({ email }).select("_id role name");

    if (existing) {
      if (existing.role === "admin") return { error: `${email} is already an administrator` };
      await UserModel.updateOne(
        { _id: existing._id },
        { role: "admin", status: "active", ...(name ? { name } : {}), ...(password ? { password: hashPassword(password) } : {}) }
      );
      return { success: true, promoted: true, email };
    }

    if (!password) return { error: "Set a password for the new administrator" };

    const created = await UserModel.create({
      name,
      email,
      password: hashPassword(password),
      role: "admin",
      status: "active",
      image: "",
    });

    return { success: true, promoted: false, admin: userFilter(created) };
  } catch (error: any) {
    console.error("Error creating admin", error);
    if (error?.code === 11000) return { error: "An account with this email already exists" };
    return { error: error?.message || "Could not create the administrator" };
  }
}

/** Demote an administrator back to a student account. */
export async function removeAdminAccess(email: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Administrator access required" };
  if (!isSuperAdminEmail(session.email)) return { error: "Only the owner account can change administrator access" };

  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return { error: "Choose an administrator to remove" };
  if (isSuperAdminEmail(normalized)) return { error: "The owner account always keeps administrator access" };
  if (normalized === String(session.email).trim().toLowerCase()) return { error: "You cannot remove your own access" };

  try {
    await connectDB();
    const result = await UserModel.updateOne({ email: normalized, role: "admin" }, { role: "student" });
    if (!result.matchedCount) return { error: "That account is not an administrator" };
    return { success: true };
  } catch (error: any) {
    console.error("Error removing admin", error);
    return { error: error?.message || "Could not update this administrator" };
  }
}

export async function getAdminUsers() {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") return { error: "Administrator access required" as const };
    try {
      await connectDB();
      const users = await UserModel.find().sort({ createdOn: -1 }).limit(200).select("name email role status createdOn lastLoginAt");
      return { users: JSON.parse(JSON.stringify(users)) };
    } catch (error: any) {
      console.error("Error loading users", error);
      return { error: error?.message || "Could not load users" };
    }
  }

export async function updateAdminUserStatus(id: string, status: "active" | "suspended") {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") return { error: "Administrator access required" as const };
    try {
      await connectDB();
      const updated = await UserModel.findByIdAndUpdate(id, { status }, { new: true }).select("_id status").lean();
      return updated ? { success: true } : { error: "User not found" };
    } catch (error: any) {
      console.error("Error updating user status", error);
      return { error: error?.message || "Could not update user status" };
  }
}

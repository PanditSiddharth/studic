"use server";

import connectDB from "@/connectDB";
import { IUser, UserModel } from "@/modals/user.model";
import { userFilter } from "@/helpers";
import { signUpSchema } from "@/modals/zod";
import { hashPassword, verifyPassword } from "./passwords";

type AuthResult = { user: Partial<IUser> } | { error: string };

/**
 * Create a student account with an email + password. OAuth accounts created by
 * the NextAuth callbacks have no password, so an existing email always means
 * "sign in instead" rather than "set a password here".
 */
export async function registerUser(input: { name?: string; email?: string; password?: string }): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({
    name: input?.name,
    email: input?.email,
    password: input?.password,
    confirmPassword: input?.password,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  try {
    await connectDB();
    const email = parsed.data.email;
    const existing = await UserModel.findOne({ email }).select("_id status role");
    if (existing) {
      if (existing.status && existing.status !== "active") {
        return { error: "This account is not active. Please contact support." };
      }
      return { error: "An account with this email already exists. Sign in instead." };
    }

    const created = await UserModel.create({
      name: parsed.data.name,
      email,
      password: hashPassword(parsed.data.password),
      image: "",
      role: "student",
      status: "active",
    });

    return { user: userFilter(created) };
  } catch (error: any) {
    console.error("Error registering user", error);
    if (error?.code === 11000) return { error: "An account with this email already exists. Sign in instead." };
    return { error: error?.message || "Could not create your account" };
  }
}

/**
 * Validate email/password credentials for the NextAuth Credentials provider.
 * Returns null for any failure so we never leak whether an email exists.
 */
export async function verifyCredentials(email: string, password: string): Promise<Partial<IUser> | null> {
  if (!email || !password) return null;
  try {
    await connectDB();
    const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) return null;
    if (user.status && user.status !== "active") return null;
    if (!verifyPassword(password, user.password)) return null;

    await UserModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    return userFilter(user);
  } catch (error) {
    console.error("Error verifying credentials", error);
    return null;
  }
}

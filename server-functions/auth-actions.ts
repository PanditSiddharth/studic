"use server";

import connectDB from "@/connectDB";
import { IUser, UserModel } from "@/modals/user.model";
import { OtpPurpose, OtpModel } from "@/modals/email-verification.model";
import { userFilter, isSuperAdminEmail } from "@/helpers";
import { otpCodeSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/modals/zod";
import { hashPassword, verifyPassword } from "./passwords";
import { rateLimit } from "@/lib/rate-limit";
import { generateOtp, hashOtp, otpMatches, signLoginToken } from "@/lib/otp";
import { ensureDeviceId, readDeviceId, writeDeviceId } from "@/lib/device";
import { sendTransactionalMail } from "@/lib/mail";
import { z } from "zod";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type IssueResult =
  | { ok: true; code: string }
  | { ok: false; error: string; retryAfter?: number };

type ConsumeResult = { ok: true } | { ok: false; error: string };

const otpEmailSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });

const normalizeEmail = (value?: string) => String(value || "").trim().toLowerCase();

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character];
  });
}

function otpEmailHtml(code: string, purpose: OtpPurpose, name?: string) {
  const safeName = name ? escapeHtml(name) : "";
  const heading =
    purpose === "register"
      ? "Verify your email"
      : purpose === "reset"
        ? "Reset your password"
        : "New device sign-in";
  const intro =
    purpose === "register"
      ? "Use this code to finish creating your Studic account."
      : purpose === "reset"
        ? "Use this code to set a new password for your Studic account."
        : "Someone is signing in to your Studic account from a new device. If this was you, use the code below.";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="max-width:520px;margin:32px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:32px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6366f1;">Studic</p>
      <h1 style="margin:0 0 12px;font-size:22px;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#4b5563;">${safeName ? `Hi ${safeName},<br/>` : ""}${intro}</p>
      <div style="margin:0 0 24px;padding:18px;border-radius:12px;background:#eef2ff;text-align:center;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4338ca;">${code}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#4b5563;">This code expires in 10 minutes.</p>
      <p style="margin:0;font-size:13px;line-height:20px;color:#4b5563;">If you did not request this, you can safely ignore this email.</p>
    </div>
  </body>
</html>`;
}

async function deliverOtp(email: string, code: string, purpose: OtpPurpose, name?: string) {
  await sendTransactionalMail({
    to: email,
    subject: `${code} is your Studic verification code`,
    html: otpEmailHtml(code, purpose, name),
  });
}

/** Replace any previous code for this email + purpose, with a resend cooldown. */
async function issueOtp(email: string, purpose: OtpPurpose): Promise<IssueResult> {
  await connectDB();
  const now = Date.now();
  const existing = await OtpModel.findOne({ email, purpose }).select("createdOn updatedAt").lean();

  if (existing) {
    const lastSent = new Date(existing.updatedAt || existing.createdOn || 0).getTime();
    const waitMs = OTP_RESEND_MS - (now - lastSent);
    if (waitMs > 0) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting another code.`,
        retryAfter: Math.ceil(waitMs / 1000),
      };
    }
  }

  const code = generateOtp();
  try {
    await OtpModel.findOneAndUpdate(
      { email, purpose },
      {
        $set: {
          codeHash: hashOtp(code),
          attempts: 0,
          expiresAt: new Date(now + OTP_TTL_MS),
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error issuing OTP", error);
    return { ok: false, error: "Could not send a code right now. Please try again." };
  }

  return { ok: true, code };
}

async function consumeOtp(email: string, purpose: OtpPurpose, code?: string): Promise<ConsumeResult> {
  const parsed = otpCodeSchema.safeParse(code);
  if (!parsed.success) return { ok: false, error: "Enter the 6-digit code." };

  await connectDB();
  const record = await OtpModel.findOne({ email, purpose });
  if (!record) return { ok: false, error: "This code is invalid or has expired. Request a new one." };

  if (record.expiresAt.getTime() <= Date.now()) {
    await OtpModel.deleteOne({ _id: record._id });
    return { ok: false, error: "This code has expired. Request a new one." };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await OtpModel.deleteOne({ _id: record._id });
    return { ok: false, error: "Too many incorrect attempts. Request a new code." };
  }

  if (!otpMatches(parsed.data, record.codeHash)) {
    record.attempts += 1;
    await record.save();
    return {
      ok: false,
      error:
        record.attempts >= OTP_MAX_ATTEMPTS
          ? "Too many incorrect attempts. Request a new code."
          : "Incorrect code. Please try again.",
    };
  }

  await OtpModel.deleteOne({ _id: record._id });
  return { ok: true };
}

/** Send a login OTP to an existing, active account. */
export async function sendLoginOtp(email: string): Promise<{ sent: boolean; error?: string; retryAfter?: number }> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { sent: false, error: "Enter a valid email address." };

  const limiter = rateLimit(`login-otp:${normalized}`, 5, 60 * 60 * 1000);
  if (!limiter.allowed) {
    return { sent: false, error: "Too many codes requested. Please try again later.", retryAfter: limiter.retryAfter };
  }

  await connectDB();
  const user = await UserModel.findOne({ email: normalized }).select("name status").lean();
  if (!user || (user.status && user.status !== "active")) {
    return { sent: false, error: "Email or password is incorrect. Please try again." };
  }

  const issued = await issueOtp(normalized, "login");
  if (!issued.ok) return { sent: false, error: issued.error, retryAfter: issued.retryAfter };

  try {
    await deliverOtp(normalized, issued.code, "login", user.name);
    return { sent: true };
  } catch (error) {
    console.error("Error sending login OTP", error);
    await OtpModel.deleteOne({ email: normalized, purpose: "login" });
    return { sent: false, error: "Could not send the code right now. Please try again." };
  }
}

/** True when this browser already passed an OTP for this account. */
export async function isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
  if (!userId || !deviceId) return false;
  await connectDB();
  const user = await UserModel.findOne({ _id: userId, devices: deviceId }).select("_id").lean();
  return Boolean(user);
}

/**
 * Step 1 of registration: validate the form and email a code. No account is
 * created until the code is verified, so unverified emails never pollute the DB.
 */
export async function requestRegistrationOtp(
  input: { name?: string; email?: string; password?: string }
): Promise<{ otpRequired: true; message: string } | { error: string }> {
  const parsed = signUpSchema.safeParse({
    name: input?.name,
    email: input?.email,
    password: input?.password,
    confirmPassword: input?.password,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  const email = parsed.data.email;
  const registrationLimit = rateLimit(`register:${email}`, 5, 60 * 60 * 1000);
  if (!registrationLimit.allowed) return { error: "Too many registration attempts. Please try again later." };

  try {
    await connectDB();
    const existing = await UserModel.findOne({ email }).select("_id status").lean();
    if (existing) {
      if (existing.status && existing.status !== "active") {
        return { error: "This account is not active. Please contact support." };
      }
      return { error: "An account with this email already exists. Sign in instead." };
    }

    const issued = await issueOtp(email, "register");
    if (!issued.ok) return { error: issued.error };

    try {
      await deliverOtp(email, issued.code, "register", parsed.data.name);
    } catch (error) {
      console.error("Error sending registration OTP", error);
      await OtpModel.deleteOne({ email, purpose: "register" });
      return { error: "Could not send the verification code. Please try again." };
    }

    return { otpRequired: true, message: "We sent a 6-digit code to your email." };
  } catch (error: any) {
    console.error("Error starting registration", error);
    return { error: "Could not start registration. Please try again." };
  }
}

/** Step 2 of registration: verify the code, create the account and trust this device. */
export async function verifyRegistrationOtp(input: {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
}): Promise<{ user: Partial<IUser>; token: string } | { error: string }> {
  const parsed = signUpSchema.safeParse({
    name: input?.name,
    email: input?.email,
    password: input?.password,
    confirmPassword: input?.password,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  const email = parsed.data.email;
  const verified = await consumeOtp(email, "register", input?.otp);
  if (!verified.ok) return { error: verified.error };

  try {
    await connectDB();
    const existing = await UserModel.findOne({ email }).select("_id status").lean();
    if (existing) {
      return { error: "An account with this email already exists. Sign in instead." };
    }

    const deviceId = await ensureDeviceId();
    const created = await UserModel.create({
      name: parsed.data.name,
      email,
      password: hashPassword(parsed.data.password),
      image: "",
      role: isSuperAdminEmail(email) ? "admin" : "student",
      status: "active",
      emailVerified: new Date(),
      devices: [deviceId],
    });

    await writeDeviceId(deviceId);

    return {
      user: userFilter(created),
      token: signLoginToken({ email, deviceId }),
    };
  } catch (error: any) {
    console.error("Error registering user", error);
    if (error?.code === 11000) return { error: "An account with this email already exists. Sign in instead." };
    return { error: "Could not create your account. Please try again." };
  }
}

/**
 * Step 1 of sign-in: confirm the password and decide whether this browser is
 * already trusted. Unknown devices get an OTP email instead of a session.
 */
export async function startLoginCheck(
  input: { email?: string; password?: string }
): Promise<{ otpRequired: boolean; message?: string } | { error: string }> {
  const parsed = signInSchema.safeParse({ email: input?.email, password: input?.password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password, { recordLogin: false });
  if (!user?._id) return { error: "Email or password is incorrect. Please try again." };

  const trusted = await isDeviceTrusted(String(user._id), await readDeviceId());
  if (trusted) return { otpRequired: false };

  const sent = await sendLoginOtp(String(user.email));
  if (!sent.sent) return { error: sent.error || "Could not send the verification code. Please try again." };

  return { otpRequired: true, message: `We sent a 6-digit code to ${user.email}.` };
}

/** Step 2 of sign-in: verify the OTP and mint a short-lived login token. */
export async function verifyLoginOtp(
  input: { email?: string; otp?: string }
): Promise<{ token: string } | { error: string }> {
  const parsed = otpEmailSchema.safeParse({ email: input?.email });
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data.email;
  const verified = await consumeOtp(email, "login", input?.otp);
  if (!verified.ok) return { error: verified.error };

  try {
    await connectDB();
    const user = await UserModel.findOne({ email }).select("_id email name status").lean();
    if (!user || (user.status && user.status !== "active")) {
      return { error: "This account is not active. Please contact support." };
    }

    const deviceId = await ensureDeviceId();
    await UserModel.updateOne(
      { _id: user._id },
      { $addToSet: { devices: deviceId }, $set: { lastLoginAt: new Date() } }
    );
    await writeDeviceId(deviceId);

    return { token: signLoginToken({ email: user.email, deviceId }) };
  } catch (error) {
    console.error("Error verifying login OTP", error);
    return { error: "Could not complete sign-in. Please try again." };
  }
}

/** Step 1 of password reset. Always returns the same message (no account enumeration). */
export async function requestPasswordResetOtp(input: { email?: string }): Promise<{ success: true; message: string } | { error: string }> {
  const parsed = otpEmailSchema.safeParse({ email: input?.email });
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data.email;
  const genericResponse = {
    success: true as const,
    message: "If an account exists for this email, we sent a 6-digit code.",
  };

  const limiter = rateLimit(`reset-otp:${email}`, 5, 60 * 60 * 1000);
  if (!limiter.allowed) return { error: "Too many codes requested. Please try again later." };

  try {
    await connectDB();
    const user = await UserModel.findOne({ email }).select("name status").lean();
    if (!user || (user.status && user.status !== "active")) return genericResponse;

    const issued = await issueOtp(email, "reset");
    if (!issued.ok) return genericResponse;

    try {
      await deliverOtp(email, issued.code, "reset", user.name);
    } catch (error) {
      console.error("Error sending password reset OTP", error);
      await OtpModel.deleteOne({ email, purpose: "reset" });
    }
    return genericResponse;
  } catch (error) {
    console.error("Error starting password reset", error);
    return genericResponse;
  }
}

/** Step 2 of password reset: verify the code and replace the password hash. */
export async function verifyPasswordResetOtp(input: {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}): Promise<{ success: true } | { error: string }> {
  const parsed = resetPasswordSchema.safeParse({
    email: input?.email,
    password: input?.password,
    confirmPassword: input?.confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  const email = parsed.data.email;
  const verified = await consumeOtp(email, "reset", input?.otp);
  if (!verified.ok) return { error: verified.error };

  try {
    await connectDB();
    const user = await UserModel.findOne({ email }).select("_id status").lean();
    if (!user || (user.status && user.status !== "active")) {
      return { error: "This account is not active. Please contact support." };
    }

    // After proving email ownership, trust the current browser and drop any
    // previously trusted devices.
    const deviceId = await ensureDeviceId();
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { password: hashPassword(parsed.data.password), devices: [deviceId] } }
    );
    await writeDeviceId(deviceId);

    return { success: true };
  } catch (error) {
    console.error("Error resetting password", error);
    return { error: "Could not reset your password. Please try again." };
  }
}

/**
 * Validate email/password credentials for the NextAuth Credentials provider.
 * Returns null for any failure so we never leak whether an email exists.
 */
export async function verifyCredentials(
  email: string,
  password: string,
  options?: { recordLogin?: boolean }
): Promise<Partial<IUser> | null> {
  if (!email || !password) return null;
  const normalizedEmail = email.trim().toLowerCase();
  // A single sign-in can check twice (startLoginCheck + authorize), so keep a
  // generous ceiling while still blocking brute force.
  const limiter = rateLimit(`login:${normalizedEmail}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) return null;
  try {
    await connectDB();
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return null;
    if (user.status && user.status !== "active") return null;
    if (!verifyPassword(password, user.password)) return null;

    if (options?.recordLogin !== false) {
      await UserModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    }
    return userFilter(user);
  } catch (error) {
    console.error("Error verifying credentials", error);
    return null;
  }
}

import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";
import { isDeviceTrusted, sendLoginOtp, verifyCredentials } from "@/server-functions/auth-actions";
import { verifyLoginToken } from "@/lib/otp";
import { readDeviceId } from "@/lib/device";
import connectDB from "@/connectDB";
import { UserModel } from "@/modals/user.model";
import { verifyGoogleIdToken } from "@/lib/google-one-tap";

export default {
    cookies:
    {
        sessionToken: {
            name: "user",
            options: {
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            }
        }
    },
    providers: [
        Google,
        Github({ issuer: "https://github.com/login/oauth" }),
        Credentials({
            name: "Email and password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                // Short-lived proof that the OTP step was completed on this browser.
                loginToken: { label: "Login token", type: "text" },
            },
            async authorize(credentials) {
                const loginToken = typeof credentials?.loginToken === "string" ? credentials.loginToken : "";
                if (loginToken) {
                    const payload = verifyLoginToken(loginToken);
                    if (!payload) return null;
                    try {
                        await connectDB();
                        const user = await UserModel.findOne({ email: payload.email })
                            .select("name email image status")
                            .lean();
                        if (!user || (user.status && user.status !== "active")) return null;
                        return {
                            id: String(user._id),
                            name: user.name,
                            email: user.email,
                            image: user.image || "",
                        };
                    } catch (error) {
                        console.error("Error validating login token", error);
                        return null;
                    }
                }

                const email = typeof credentials?.email === "string" ? credentials.email : "";
                const password = typeof credentials?.password === "string" ? credentials.password : "";
                if (!email || !password) return null;

                const user = await verifyCredentials(email, password, { recordLogin: false });
                if (!user?._id) return null;

                // A browser that has never completed an OTP for this account is
                // not allowed to create a session yet.
                const trusted = await isDeviceTrusted(String(user._id), await readDeviceId());
                if (!trusted) {
                    await sendLoginOtp(String(user.email));
                    return null;
                }

                try {
                    await connectDB();
                    await UserModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
                } catch (error) {
                    console.error("Error recording login", error);
                }

                return {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    image: user.image || "",
                };
            },
        }),
        /**
         * Google One Tap (FedCM) sign-in.
         *
         * The browser hands us a Google ID token, which is verified here on the
         * server. Returning the verified email lets the existing `signIn`
         * callback in `auth.ts` find or create the matching Studic account, so
         * no second auth system or duplicate account is introduced.
         */
        Credentials({
            id: "google-one-tap",
            name: "Google One Tap",
            credentials: {
                credential: { label: "Google credential", type: "text" },
            },
            async authorize(credentials) {
                const credential = typeof credentials?.credential === "string" ? credentials.credential : "";
                const profile = await verifyGoogleIdToken(credential);
                if (!profile) return null;

                return {
                    // `id` is only used to seed the JWT; the jwt callback replaces
                    // it with the real Studic user record looked up by email.
                    id: profile.sub,
                    name: profile.name || profile.email.split("@")[0],
                    email: profile.email,
                    image: profile.picture || "",
                };
            },
        }),
    ]
} satisfies NextAuthConfig

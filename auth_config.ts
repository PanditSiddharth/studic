import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";
import { verifyCredentials } from "@/server-functions/auth-actions";

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
            },
            async authorize(credentials) {
                const email = typeof credentials?.email === "string" ? credentials.email : "";
                const password = typeof credentials?.password === "string" ? credentials.password : "";
                if (!email || !password) return null;

                const user = await verifyCredentials(email, password);
                if (!user?._id) return null;

                return {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    image: user.image || "",
                };
            },
        }),
    ]
} satisfies NextAuthConfig

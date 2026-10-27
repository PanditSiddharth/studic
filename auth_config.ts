import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import { NextAuthConfig } from "next-auth";

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
    providers: [Google, Github({ issuer: "https://github.com/login/oauth" })]
} satisfies NextAuthConfig

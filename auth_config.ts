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
                secure: true,
                domain:  process.env.NODE_ENV === "production" ? ".studic.in" : undefined,
            }
        }
    },
    providers: [Google,Github]} satisfies NextAuthConfig


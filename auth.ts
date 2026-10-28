import NextAuth, { Session } from "next-auth";
import auth_config from "./auth_config";
import { createUser, checkExistingUser } from "@/server-functions/user";
import { UserModel, type IUser } from "@/modals/user.model";
import connectDB from "@/connectDB";
import { isSuperAdminEmail, userFilter } from "./helpers";

declare module 'next-auth' {
  interface Session {
    user: IUser,
    token: IUser
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user }) {
      if (!user || !user.email) {
        return false;
      }
      const existingUser = await checkExistingUser(user.email);
      if (typeof existingUser === "object" && existingUser.status && existingUser.status !== "active") {
        return false;
      }

      if (!existingUser && user.name) {
        await createUser({
          email: user.email,
          name: user.name,
          image: user.image || "",
          role: isSuperAdminEmail(user.email) ? "admin" : undefined,
        });
      } else if (
        typeof existingUser === "object" &&
        isSuperAdminEmail(user.email) &&
        existingUser.role !== "admin"
      ) {
        await connectDB();
        await UserModel.updateOne(
          { email: user.email.trim().toLowerCase() },
          { $set: { role: "admin", status: "active" } }
        );
      }

      return true;
    },

    async jwt({ token, trigger, session, user }) {
      if (trigger === "signIn") {
        const existingUser = await checkExistingUser(user.email!);
        if (typeof existingUser === "object")
          return { ...token, ...existingUser }
      }
      if (trigger === 'update' && session?.user)
        return { ...token, ...userFilter(session.user) };

      return token;
    },
    // Disable type checking issues here
    async session({ session, token }) {
      if (session?.user) 
        session.user = { ...session.user, ...userFilter(token) }
      return session as Session; // Ensure we always return session
    }
  },  
  ...auth_config,
});
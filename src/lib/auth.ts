import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  authenticateAccount,
  authConfigured,
  configuredAccounts,
} from "./accounts";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (!authConfigured()) return null;
        return authenticateAccount(
          credentials?.username,
          credentials?.password,
        );
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.username = token.sub ?? "";
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      // Removing an account invalidates its existing sessions.
      if (
        !configuredAccounts().some((account) => account.username === token.sub)
      )
        throw new Error("Account is no longer available.");
      return token;
    },
  },
};

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import createGoogleProvider from "next-auth/providers/google";
import createMicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "~/infra/dataAccess/db/connection";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "~/infra/dataAccess/db/schema/auth";

export const config = {
  theme: {
    logo: "/logo.webp",
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [createGoogleProvider, createMicrosoftEntraIDProvider],
  callbacks: {
    signIn(params) {
      console.log("callback signin", params);
      return true;
    },
    redirect({ url, baseUrl }) {
      console.log("callback redirect", { url, baseUrl });
      return baseUrl;
    },
  },
  session: {
    strategy: "database", // this is default when using adapter
  },
  pages: {
    signIn: "/auth/signin",
  },
  basePath: process.env.CJ_AUTH_PATH,
  debug: process.env.NODE_ENV !== "production" ? true : false,
  logger: {
    error(error: Error) {
      console.error("NextAuth error:", error.message, error.stack);
    },
    warn(code) {
      console.warn(`NextAuth warning: ${code}`);
    },
    info(message: string) {
      console.info("NextAuth info:", message);
    },
    debug(message: string, metadata: unknown) {
      console.debug("NextAuth debug:", message);
      console.debug("NextAuth debug:", metadata);
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

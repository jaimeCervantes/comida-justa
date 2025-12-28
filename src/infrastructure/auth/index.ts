import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import createGoogleProvider from "next-auth/providers/google";
import createMicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";
import { db } from "~/infrastructure/dataAccess/init";

export const config = {
  theme: {
    logo: "/logo.png",
  },
  adapter: FirestoreAdapter(db),
  providers: [createGoogleProvider, createMicrosoftEntraIDProvider],
  callbacks: {
    signIn(params) {
      console.log("callback signin", params);
      return true;
    },
  },
  session: {
    strategy: "database", // this is default when using adapter
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

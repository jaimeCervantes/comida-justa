import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";

import createGoogleProvider from "next-auth/providers/google";

export const config = {
  theme: {
    logo: "/logo.png",
  },
  adapter: FirestoreAdapter(),
  providers: [createGoogleProvider],
  callbacks: {
    signIn(params) {
      console.log(params);
      return true;
    },
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

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";

import Google from "next-auth/providers/google";

export const config = {
  theme: {
    logo: "/logo.png",
  },
  adapter: FirestoreAdapter(),
  providers: [Google],
  basePath: "/auth",
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

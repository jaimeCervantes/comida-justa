import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import createGoogleProvider from "next-auth/providers/google";
import createMicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";
import { db } from "~/infra/dataAccess/db/connection";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/infra/dataAccess/db/schema/auth";
import { safeReturnUrl } from "./returnPath";

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
    /**
     * A dónde se sale después de entrar.
     *
     * **`@auth/core` llama a esto con el `callbackUrl` que llega por query o por cookie, y guarda
     * lo que se devuelva en la cookie `callback-url`.** Devolver `baseUrl` siempre —como hacía
     * antes— reescribía cualquier destino como la portada antes incluso de salir hacia el
     * proveedor, así que ningún `?callbackUrl=` del sitio llegaba a ninguna parte.
     *
     * `safeReturnUrl` conserva el destino cuando es de este sitio y no es la propia pantalla de
     * acceso; cuando no, se cae a la portada. Lo segundo no es cosmética: sin ello, el destino que
     * next-auth pone por omisión (la dirección actual, o sea la pantalla de acceso) devolvería a
     * la puerta a quien ya entró.
     */
    redirect({ url, baseUrl }) {
      return safeReturnUrl(url, baseUrl) ?? baseUrl;
    },
  },
  session: {
    strategy: "database", // this is default when using adapter
  },
  pages: {
    signIn: "/auth/signin",
  },
  basePath: process.env.CJ_AUTH_PATH,
  debug: process.env.NODE_ENV !== "production",
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

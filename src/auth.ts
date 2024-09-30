import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import createGoogleProvider from "next-auth/providers/google";
import createMicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import { db } from "~/firebase/init"

export const config = {
  theme: {
    logo: "/logo.png",
  },
  adapter: FirestoreAdapter(db),
  providers: [
    createGoogleProvider,
    createMicrosoftEntraId({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
      authorization: {
        params: {
          scope: "openid email User.Read profile ProfilePhoto.Read.All"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          oid: profile.oid,
          name: profile.name,
          email: profile.email,
          givenName: profile.given_name,
          surname: profile.family_name,
          jobTitle: profile.jobTitle,
          officeLocation: profile.officeLocation,
          preferredLanguage: profile.preferredLanguage,
          userPrincipalName: profile.userPrincipalName
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, }) {
      console.log(user, account, profile)
      if (account?.provider === "microsoft-entra-id") {
        const accessToken = account.access_token;

        // Realiza la solicitud a Microsoft Graph para obtener la imagen de perfil
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
        // const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${profile.oid}/photo/$value`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log(graphResponse);
        if (graphResponse.ok) {
          const imageBuffer = await graphResponse.buffer(); // Obtén la imagen como buffer
          const imageBase64 = imageBuffer.toString("base64"); // Convierte la imagen a base64

          const imageUrl = `data:image/jpeg;base64,${imageBase64}`; // Construye el Data URL para la imagen

          // Actualiza el perfil del usuario en Firestore
          const userDocRef = db.collection("users").doc(user.id);
          await userDocRef.update({
            image: imageUrl, // Guarda la imagen en base64 o como URL
          });
        }
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      return "/";
    },
  },
  basePath: process.env.CJ_AUTH_PATH,
  debug: false, // process.env.NODE_ENV !== "production" ? true : false,
  // logger: {
  //   error(error: Error) {
  //     console.error("NextAuth error:", error.message, error.stack);
  //   },
  //   warn(code) {
  //     console.warn(`NextAuth warning: ${code}`);
  //   },
  //   info(message: string) {
  //     console.info("NextAuth info:", message);
  //   },
  //   debug(message: string, metadata: unknown) {
  //     console.debug("NextAuth debug:", message);
  //     console.debug("NextAuth debug:", metadata);
  //   },
  // },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

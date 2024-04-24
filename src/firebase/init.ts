import admin from "firebase-admin";
import serviceAccount from "../../serviceAccountKey.json";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      storageBucket: process.env.STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.log("Firebase admin initialization error", error?.stack);
  }
}

export const db = admin.firestore();

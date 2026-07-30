import admin from "firebase-admin";

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.STORAGE_BUCKET,
      });
    } catch (error) {
      console.log(
        "Firebase admin initialization error",
        error instanceof Error ? error.stack : error,
      );
    }
  }

  return admin;
}

export const storage = getFirebaseAdmin().storage();
export const auth = getFirebaseAdmin().auth();
export const db = getFirebaseAdmin().firestore();

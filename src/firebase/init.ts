import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.log("Firebase admin initialization error", error?.stack);
  }
}

export const db = admin.firestore();

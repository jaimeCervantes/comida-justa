import admin from "firebase-admin";

if (!admin.apps.length) {
  try {

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.log("Firebase admin initialization error", error?.stack);
  }
}

export const db = admin.firestore();

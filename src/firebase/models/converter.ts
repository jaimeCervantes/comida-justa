import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "../init";

const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});

export const getCollectionWithConverter = <
  T extends FirebaseFirestore.DocumentData,
>(
  collectionPath: string
) => db.collection(collectionPath).withConverter(converter<T>());

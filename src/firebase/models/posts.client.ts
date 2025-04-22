import {
    getDocs,
    query,
    orderBy,
    limit as limitFn,
    startAfter as startAfterFn,
    where,
    collection,
    getFirestore,
    QueryDocumentSnapshot,
    Timestamp
  } from "firebase/firestore";
  
  import { db } from "../init.client";
  import type { Post } from "~/types/Posts";
  
  export async function getPosts({
    limit = 6,
    startAfter = null,
    by = null,
  }: {
    limit?: number;
    startAfter?: QueryDocumentSnapshot | null;
    by?: { field: string; operator: any; value: string } | null;
  }) {
    let postsRef = collection(db, "posts");
  
    let q = query(postsRef, orderBy("createdAt", "desc"), limitFn(limit));
  
    if (by?.field && by?.operator && by?.value) {
      q = query(postsRef, where(by.field, by.operator, by.value), orderBy("createdAt", "desc"), limitFn(limit));
    }
  
    if (startAfter) {
      q = query(q, startAfterFn(startAfter));
    }
  
    const snapshot = await getDocs(q);
  
    const posts: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  
    const lastItem = snapshot.docs[snapshot.docs.length - 1] ?? null;
  
    return {
      posts,
      lastItem,
    };
  }
  
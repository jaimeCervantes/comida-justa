import type { Timestamp, DocumentData } from "firebase-admin/firestore";
import type { PostUser } from "~/types/Posts.d.ts";
export type FirestorePost = Post &
  DocumentData & {
    image: string;
    user: PostUser;
  };

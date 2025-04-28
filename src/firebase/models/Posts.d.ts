import type { Timestamp, DocumentData } from "firebase-admin/firestore";
import type { Post, PostUser } from "~/types/Posts.d.ts";
export type FirestorePost = Post & DocumentData & {
  user: PostUser;
};

export type FirestoreComment = DocumentData & {
  id?: string;
  content: string;
  createdAt: Timestamp;
  user: PostUser;
  postId: string;
};

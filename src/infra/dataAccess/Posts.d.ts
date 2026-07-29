import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import type { Post, PostUser } from "~/infra/types/Posts";
export type FirestorePost = Post &
  DocumentData & {
    user: PostUser;
  };

export type FirestoreComment = DocumentData & {
  id?: string;
  content: string;
  createdAt: Timestamp;
  user: PostUser;
  postId: string;
};

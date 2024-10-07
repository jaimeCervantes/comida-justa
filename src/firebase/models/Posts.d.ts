import type { Timestamp, DocumentData } from "firebase-admin/firestore";
<<<<<<< HEAD
import type { PostUser } from "~/types/Posts.d.ts";
export type FirestorePost = Post &
  DocumentData & {
=======
import type { Post, PostUser } from "~/types/Posts.d.ts";
export type FirestorePost = Post & DocumentData & {
>>>>>>> dev
    image: string;
    user: PostUser;
  };

export type FirestoreComment = DocumentData & {
  id?: string;
  content: string;
  createdAt: Timestamp;
  user: PostUser;
  postId: string;
};

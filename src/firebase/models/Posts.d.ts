import type { Timestamp, DocumentData } from "firebase-admin/firestore";
import type { Post, PostUser } from "~/types/Posts.d";

export type PostUser = {
  id: string;
  name: string;
  avatar?: string;
};


export type Post = {
  id: string;
  title: string;
  media: {  
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    loading?: "lazy" | "eager";
  };
  createdAt: Timestamp;
  user: PostUser;
  price?: number;
  slug?: string;
};


export type FirestorePost = Post & DocumentData & {
  media: { 
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    loading?: "lazy" | "eager";
  };
  user: PostUser;
};
import type { FirestorePost } from "~/infrastructure/dataAccess/Posts";
import { getCollectionWithConverter } from "~/infrastructure/dataAccess/converter";

export const collections = {
  posts: () => getCollectionWithConverter<FirestorePost>("posts"),
};
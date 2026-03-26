import type { FirestorePost } from "~/infra/dataAccess/Posts";
import { getCollectionWithConverter } from "~/infra/dataAccess/converter";

export const collections = {
  posts: () => getCollectionWithConverter<FirestorePost>("posts"),
};

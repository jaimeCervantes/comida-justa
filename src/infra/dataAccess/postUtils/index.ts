import { getCollectionWithConverter } from "~/infra/dataAccess/converter";
import type { FirestorePost } from "~/infra/dataAccess/Posts";

export const collections = {
  posts: () => getCollectionWithConverter<FirestorePost>("posts"),
};

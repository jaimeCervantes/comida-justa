import { db } from "~/infra/dataAccess/init";

/**
 * Delete a post by its slug. If the post does not exist, it returns false.
 * If the post exists and is deleted, it returns true.
 * If the doc contains subcollections, it will delete them.
 * @param postSlug the slug of the post to delete
 * @returns
 */
export async function deleteOnePostBySlug(postSlug: string) {
  const result = await db
    .collection("posts")
    .where("translations.es.slug", "==", postSlug)
    .get();

  if (!result.empty) {
    const doc = result.docs[0];
    await doc.ref.delete();
    // Check if the document has subcollections and delete them
    // Note: This will delete all documents in the subcollection
    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      await subcollection.get().then((snapshot) => {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      });
    }
    return true;
  }

  return false;
}

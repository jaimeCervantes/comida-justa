import { db } from '~/infrastructure/dataAccess/init';

export async function deleteCommentsByPostSlug(postSlug: string) {
  const result = await db.collection('posts').where("slug", "==", postSlug).get();

  if (result.empty) {
    return;
  }

  const doc = result.docs[0];
  const commentsSnapshot = await doc.ref.collection("comments").get();

  const batch = db.batch();
  commentsSnapshot.docs.forEach((comment) => {
    batch.delete(comment.ref);
  });

  await batch.commit();
}
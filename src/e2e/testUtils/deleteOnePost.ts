import { db } from '~/infra/dataAccess/init';

export async function deleteOnePostBySlug(postSlug: string) {
  const result = await db.collection('posts').where("slug", "==", postSlug).get();

  if (!result.empty) {
    const doc = result.docs[0];
    await doc.ref.delete();
    return true;
  }

  return false;
}
import { Timestamp } from "firebase-admin/firestore";
import IPostCreationDTO from "~/business/createOnePost/dtos/IPostCreationDTO";
import IPostRepository from "~/business/createOnePost/ports/IPostRepository";
import { collections } from "../postUtils";

export default class FirebasePostsRespository implements IPostRepository {
  async save(postData: IPostCreationDTO, lang: string = "es"): Promise<string> {
    const data = {
      contactInfo: postData.contactInfo,
      media: postData.media,
      user: postData.user,
      price: postData?.price || null,
      createdAt: Timestamp.fromDate(postData.createdAt),
      translations: {
        [lang]: {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
        }
      }
    };

    const post = await collections.posts().add(data);

    return post.id;
  }

  async createUniqueSlug(slug: string, lang: string = "es"): Promise<string> {
    const querySnapshot = await collections.posts().where(`translations.${lang}.slug`, "==", slug).get();

    if (querySnapshot.size > 0) {
      return `${slug}-${querySnapshot.size}`;
    }

    return slug;
  }
}
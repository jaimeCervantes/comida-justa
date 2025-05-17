import { Timestamp } from "firebase-admin/firestore";
import IPostCreationDTO from "~/business/createOnePost/dtos/IPostCreationDTO";
import IPostRepository from "~/business/createOnePost/ports/IPostRepository";
import { collections } from "../postUtils";

export default class FirebasePostsRespository implements IPostRepository {
  async save(postData: IPostCreationDTO) {
    const data = {
      ...postData,
      createdAt: Timestamp.fromDate(postData.createdAt)
    }

    const post = await collections.posts().add(data);

    return post.id;
  }

  async createUniqueSlug(slug: string): Promise<string> {
    const querySnapshot = await collections.posts().where("slug", "==", slug).get();

    if (querySnapshot.size > 0) {
      return `${slug}-${querySnapshot.size}`;
    }

    return slug;
  }
}
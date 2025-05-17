import IPostCreationDTO from "~/business/createOnePost/dtos/IPostCreationDTO";

export default interface IPostRepository {
  save(postData: IPostCreationDTO): Promise<string>;
  createUniqueSlug(slug: string): Promise<string>;
}
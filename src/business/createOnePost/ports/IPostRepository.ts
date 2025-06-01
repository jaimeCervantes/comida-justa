import IPostCreationDTO from "~/business/createOnePost/dtos/IPostCreationDTO";

export default interface IPostRepository {
  save(postData: IPostCreationDTO, lang?: string): Promise<string>;
  createUniqueSlug(slug: string, lang?: string): Promise<string>;
}
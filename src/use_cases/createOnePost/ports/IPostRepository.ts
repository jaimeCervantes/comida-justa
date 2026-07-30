import type IPostCreationDTO from "~/use_cases/createOnePost/dtos/IPostCreationDTO";

export default interface IPostRepository {
  save(postData: IPostCreationDTO, lang?: string): Promise<string>;
  createUniqueSlug(slug: string, lang?: string): Promise<string>;
}

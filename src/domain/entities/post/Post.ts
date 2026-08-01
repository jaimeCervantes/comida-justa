import type { IPostEntity } from "~/domain/entities/post/types";
import { slugify } from "~/domain/shared/slugify";

export default class PostEntity implements IPostEntity {
  /** @see slugify — la misma regla que decide la dirección de una tienda. */
  generateSlug(title: string): string {
    return slugify(title);
  }
}

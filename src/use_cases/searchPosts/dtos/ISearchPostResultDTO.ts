import { Post } from "~/domain/entities/post/types";

export type ISearchPostResultDTO = Post & {
  id: string;
};

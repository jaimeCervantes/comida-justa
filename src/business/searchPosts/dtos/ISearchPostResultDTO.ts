import { Post } from "~/business/entities/post/types";

export type ISearchPostResultDTO = Post & {
    id: string;
}

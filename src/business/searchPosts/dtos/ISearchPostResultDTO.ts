import { Post } from "~/business/entities/post/types";

export type ISearchPostResultDTO = {
    id: string;
    title: string;
    slug: string;
    content?: string;
}

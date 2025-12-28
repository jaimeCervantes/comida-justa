import { Post } from "~/business/entities/post/types";

export type ISearchPostResultDTO = {
    id: string;
    title: string;
    slug: string;
    content?: string;
    media?: Post["media"];
    createdAt: string;
    price: number;
    user: Post["user"];
}

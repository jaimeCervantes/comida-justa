import { Post, User } from "~/entities/post/types";

export default interface IPostCreationDTO extends Omit<Post, 'file'> {
  media: {
    url: string;
    type: 'image' | 'video' | 'audio' | string;
    alt: string;
  }
}
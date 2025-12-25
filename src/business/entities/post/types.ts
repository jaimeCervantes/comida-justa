export type VoidOrError = void | never;
export type Post = {
  title: string;
  slug: string;
  translations?: Record<string, any>;
  content: string;
  price?: number | null;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  media: {
    url: string;
    type: "image" | "video" | string;
    alt?: string;
  };
  user: User;
  createdAt: Date;
};

export type User = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
};

export interface IPostValidator {
  MIN_LENGTH_TITLE: number;
  MIN_LENGTH_CONTENT: number;

  validate(post: Post): VoidOrError;
  validateStringOnPost(
    value: string,
    name: string,
    minLength: number
  ): VoidOrError;
  validateNumberOnPost(value: number, name: string): VoidOrError;
  validateFile(file: File): VoidOrError;
  validateUser(user: User): VoidOrError;
}

export interface IPostEntity {
  generateSlug(title: string): string;
}

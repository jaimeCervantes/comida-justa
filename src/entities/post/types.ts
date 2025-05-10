export type VoidOrError = void | never;
export type Post = {
  title: string,
  slug: string,
  content: string,
  price?: number | null,
  contactInfo: {
    phone: string;
    email?: string
    whatsapp?: string,
  },
  file: File,
  user: User
}

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
  validateStringOnPost(value: string, name: string, minLength: number): VoidOrError;
  validateNumberOnPost(value: number, name: string): VoidOrError;
  validateFile(file: File): VoidOrError;
  validateUser(user: User): VoidOrError;
}
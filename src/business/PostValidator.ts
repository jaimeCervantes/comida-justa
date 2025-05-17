import { Post, VoidOrError, User, IPostValidator } from "~/business/entities/post/types";

export default class PostValidator implements IPostValidator {
  MIN_LENGTH_TITLE = 5;
  MIN_LENGTH_CONTENT = 15;

  validate(post: Post): VoidOrError {
    this.validateStringOnPost(post.title, "title", this.MIN_LENGTH_TITLE);
    this.validateNumberOnPost(post.price, "price");
    this.validateFile(post.file)
    this.validateStringOnPost(post.content, "content", this.MIN_LENGTH_CONTENT);
    this.validateUser(post.user);
  }

  validateStringOnPost(
    value: string,
    name: string,
    minLength: number
  ): VoidOrError {
    if (!value) {
      throw new StringOnPostError(value, `Missing ${name} prop on post entity.`);
    }

    if (typeof value !== "string") {
      throw new StringOnPostError(
        value,
        `The ${name} property should be of type string.`
      );
    }

    if (value.length < minLength) {
      throw new StringOnPostError(
        value,
        `The length of the ${name} should not be less than ${minLength}.`
      );
    }
  }

  validateNumberOnPost(value: number | null | undefined, name: string): VoidOrError {
    if (typeof value === 'undefined' || value === null) return;

    if (typeof value !== "number") {
      throw new Error(`${name} must be a number.`);
    }
  }

  validateFile(file: File) {
    if (file?.constructor.name !== "File") {
      throw new FileOnPostError(file, "file prop must be a File.");
    }
  }

  validateUser(user: User) {
    if (user?.constructor !== {}.constructor) {
      throw new UserOnPostError(user, "user should be an object")
    }

    if (typeof user?.id !== 'string') {
      throw new UserOnPostError(user, "user.id should be an string")
    }
  }
}

class FileOnPostError extends Error {
  file: File;
  constructor(value: File, message: string) {
    super(message);
    this.name = "FileOnPostEntityError";
    this.file = value;
    this.message = message;
  }
}

class StringOnPostError extends Error {
  value: string;
  constructor(value: string, message: string) {
    super(message);
    this.value = value;
    this.name = "StringOnPostEntityError";
    this.message = message;
  }
}

class UserOnPostError extends Error {
  user: User;
  constructor(user: User, message: string) {
    super(message);
    this.user = user;
    this.name = "UserOnPostEntityError";
    this.message = message;
  }
}
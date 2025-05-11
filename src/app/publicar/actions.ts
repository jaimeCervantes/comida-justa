"use server";
import { auth } from "~/infrastructure/auth";
import { redirect } from "next/navigation";
import { ActionState } from "~/infrastructure/types/Actions";
import { SIGNIN_PATH } from "~/infrastructure/constants";
import PostEntity from "~/entities/post/Post";
import { Post, User } from "~/entities/post/types";
import CreatePostUseCase from "~/domain/createOnePost";
import PostValidator from "~/domain/PostValidator";
import FirebaseMediaStorageService from "~/infrastructure/storage/FirebaseMediaStorageService";
import FirebasePostsRespository from "~/infrastructure/dataAccess/createOnePost/FirebasePostRepository";

const useCase = new CreatePostUseCase(
  new PostValidator(),
  new PostEntity(),
  new FirebasePostsRespository(),
  new FirebaseMediaStorageService()
)

export async function createPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const file = formData.get("file") as File;
  const price = formData.get("price");
  const phone = formData.get("phone") as string;

  const errors = {
    title: title ? null : "El título es obligatorio.",
    content: content ? null : "El contenido es obligatorio",
    phone: phone ? null : "El Télefono es obligatorio.",
    file: file.size > 0 ? null : "El archivo de imagen o video es obligatorio.",
  };

  const hasErrors = Object.values(errors).some((errMsg) => errMsg);

  if (hasErrors) {
    return { errors: errors, success: false, id: null, slug: null };
  }

  let result;
  try {
    result = await useCase.execute(
      {
        title,
        slug: '',
        content,
        contactInfo: {
          phone,
        },
        price: Number(price) || null,
        createdAt: new Date(),
        file: file as File,
        user: session?.user as User
      },
    );
  } catch (err: any) {
    return {
      errors: {
        errorMessage:
          process.env.NODE_ENV === "development"
            ? err?.message
            : "Sucedio un error al tratar de crear tu publicación. No eres tu, soy yo, tu servidor :(.",
      },
      id: null,
      slug: null,
    };
  }

  if (result?.error) {
    return { errors: { errorMessage: result.errorMessage }, success: false };
  }

  redirect(`/${result?.slug}`);
}

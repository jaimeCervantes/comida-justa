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
  const priceRaw = formData.get("price");
  const price = priceRaw ? Number(priceRaw): null;
  const phone = formData.get("phone") as string;

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  const errors = {
    title: !title
    ? "El título es obligatorio."
    : title.length < 4
    ? "El título es demasiado corto. Debe tener al menos 4 caracteres."
    : null,
    content: content ? null : "La descripción es obligatoria.",
    phone: !phone 
      ? "El Télefono es obligatorio."
      : !/^\d+$/.test(phone)
      ? "Elcampo solo debe contener números."
      : null,
    price: price !== null && !isNaN(price) ? null : "El precio es obligatorio.",
    file: file ? null : "El archivo de imagen o video es obligatorio.",
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
        price,
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

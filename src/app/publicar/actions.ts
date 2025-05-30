"use server";
import { generateSeo } from "./generateSeo";
import { auth } from "~/infrastructure/auth";
import { redirect } from "next/navigation";
import { ActionState } from "~/infrastructure/types/Actions";
import { SIGNIN_PATH } from "~/infrastructure/constants";
import PostEntity from "~/business/entities/post/Post";
import { Post, User } from "~/business/entities/post/types";
import CreatePostUseCase from "~/business/createOnePost";
import PostValidator from "~/business/PostValidator";
import FirebaseMediaStorageService from "~/infrastructure/storage/FirebaseMediaStorageService";
import FirebasePostsRespository from "~/infrastructure/dataAccess/createOnePost/FirebasePostRepository";

const useCase = new CreatePostUseCase(
  new PostValidator(),
  new PostEntity(),
  new FirebasePostsRespository(),
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
  const mediaJSON = formData.get("media") as string;
  const price = formData.get("price");
  const phone = formData.get("phone") as string;

  const errors = {
    title: title ? null : "El título es obligatorio.",
    content: content ? null : "El contenido es obligatorio",
    phone: phone ? null : "El Télefono es obligatorio.",
    media: mediaJSON ? null : "Los datos del recourso(video, imagen) son obligatorios"
  };

  let media = { url: '', type: '', alt: '' };
  try {
    media = JSON.parse(mediaJSON);
  } catch (error) {
    console.log(error);
  }

  const hasErrors = Object.values(errors).some((errMsg) => errMsg);

  if (hasErrors) {
    return { errors: errors, success: false, id: null, slug: null };
  }

  const seo = generateSeo({
  title,
  description: content,
  media: media.url,
});
 

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
        media: {
          url: media.url,
          type: media.type.split("/")[0],
          alt: title
        },
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

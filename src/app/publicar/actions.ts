"use server";
import { createPost } from "~/firebase/models/posts";
import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { PostUser } from "~/types/Posts";
import { ActionState } from "~/types/Actions.d";
import { SIGNIN_PATH } from "~/constants";

export async function createFood(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const image = formData.get("image") as File;
  const price = formData.get("price");

  const errors = {
    title: title ? null : "Title is required",
    content: content ? null : "Content is required",
    price: price ? null : "Precio es obligatorio",
    image: image ? null : "La imagen es obligatoria",
  };

  const hasErrors = Object.values(errors).some((errMsg) => errMsg);

  if (hasErrors) {
    return { messages: errors, error: true };
  }

  let result;
  try {
    result = await createPost(
      {
        title,
        content,
        price: Number(price),
      },
      image || null,
      session.user as PostUser
    );
  } catch (err: any) {
    return {
      error: true,
      messages: {
        errorMessage:
          process.env.NODE_ENV === "development"
            ? err?.message
            : "Sucedio un error al tratar de crear tu publicacion. No eres tu, soy yo :(.",
      },
    };
  }

  if (result?.error) {
    return { messages: { errorMessage: result.errorMessage }, error: true };
  }

  redirect(`/${result?.slug}`);
}

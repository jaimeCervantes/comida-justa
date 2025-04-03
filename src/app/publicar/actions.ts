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
  const phone = formData.get("phone") as string;

  const errors = {
    title: title ? null : "El título es obligatorio.",
    content: content ? null : "El contenido es obligatorio",
    phone: phone ? null : "El Télefono es obligatorio.",
    image: image.size > 0 ? null : "La imagen es obligatoria.",
  };

  const hasErrors = Object.values(errors).some((errMsg) => errMsg);

  if (hasErrors) {
    return { errors: errors, success: false, id: null, slug: null };
  }

  let result;
  try {
    result = await createPost(
      {
        title,
        content,
        contactInfo: {
          phone,
        },
        price: Number(price) || null
      },
      image || null,
      session.user as PostUser
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

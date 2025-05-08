"use server";
import { createOnePost } from "~/infra/dataAccess/createOnePost";
import { auth } from "~/infra/auth";
import { redirect } from "next/navigation";
import type { PostUser } from "~/infra/types/Posts";
import { ActionState } from "~/infra/types/Actions";
import { SIGNIN_PATH } from "~/infra/constants";

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
    result = await createOnePost(
      {
        title,
        content,
        contactInfo: {
          phone,
        },
        price: Number(price) || null
      },
      file || null,
      session?.user as PostUser
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

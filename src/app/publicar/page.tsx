import PublishForm from "./PublishForm";
import { auth } from "~/infrastructure/auth";
import { createPost } from "./actions";
import { redirect } from "next/navigation";
import { SIGNIN_PATH } from "~/infrastructure/constants";

export default async function PublicarPage() {
  const session = await auth();

  if (!session) {
    return redirect(SIGNIN_PATH);
  }

  return <PublishForm action={createPost}></PublishForm>;
}

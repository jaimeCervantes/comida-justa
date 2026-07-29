import { redirect } from "next/navigation";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { createPost } from "./actions";
import PublishForm from "./PublishForm";

export default async function PublicarPage() {
  const session = await auth();

  if (!session) {
    return redirect(SIGNIN_PATH);
  }

  return (
    <PublishForm action={createPost} isAdmin={isAdmin(session.user?.email)} />
  );
}

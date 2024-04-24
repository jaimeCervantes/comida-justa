import PublishForm from "./PublishForm";
import { auth } from "~/auth";
import { createFood } from "./actions";
import { redirect } from "next/navigation";
import { SIGNIN_PATH } from "~/constants";

export default async function PublicarPage() {
  const session = await auth();

  if (!session) {
    return redirect(SIGNIN_PATH);
  }

  return <PublishForm action={createFood}></PublishForm>;
}

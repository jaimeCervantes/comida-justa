import PublishForm from "./PublishForm";
import { auth } from "~/auth";
import { createFood } from "./actions";
import { redirect } from "next/navigation";
import { SIGNIN_PATH } from "~/constants";
import { getCategories } from "~/firebase/models/categories";
export default async function PublicarPage() {
  const session = await auth();
  const categories = await getCategories();
  if (!session) {
    return redirect(SIGNIN_PATH);
  }

  return <PublishForm action={createFood} categories={categories}></PublishForm>;
}

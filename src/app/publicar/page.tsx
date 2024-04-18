import PublishForm from "./PublishForm";
import { auth } from "~/auth";
import { createFood } from "./actions";
import { redirect } from "next/navigation";

export default async function PublicarPage() {
  const session = await auth();

  if (!session) {
    return redirect("/auth/signin");
  }

  return <PublishForm action={createFood}></PublishForm>;
}

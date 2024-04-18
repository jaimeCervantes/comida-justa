"use client";
import TextField from "~/components/ui/TextField";
import TextArea from "~/components/ui/TextArea";
import Button from "~/components/ui/Button";
import Link from "next/link";
import ImagePicker from "~/components/ui/ImagePicker";

import { useFormState } from "react-dom";
import { ActionState } from "~/types/Actions";

export default function PublishForm({
  action,
}: {
  action: (state: ActionState, data: FormData) => Promise<typeof state>;
}) {
  const [state, createFoodAction] = useFormState<ActionState, FormData>(
    action,
    {
      messages: {},
      error: false,
      id: null,
      slug: null,
    }
  );

  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">Publica tu nueva comida sana</h1>

      {state?.messages?.errorMessage ? (
        <h2 className="pt-1 flex items-center gap-1 text-red-700 dark:text-red-400">
          {state.messages.errorMessage}
        </h2>
      ) : null}

      <form
        method="POST"
        action={createFoodAction}
        className=""
        aria-label="Publica tu nueva comida sana"
      >
        <TextField
          autoFocus
          required
          name="title"
          type="text"
          label="Titulo de la publicación:"
          error={state?.messages?.title}
        />

        <TextField
          required
          name="price"
          type="number"
          label="Precio:"
          error={state?.messages?.price}
        />

        <ImagePicker
          name="image"
          label="Selecciona tu mejor imagen"
        ></ImagePicker>

        <TextArea
          name="content"
          required
          label="Descripción del producto:"
          rows={8}
          maxLength={250}
          error={state?.messages?.content as string}
        />
        <footer className="flex justify-center gap-5 mt-4">
          <Link href="/">
            <Button>Cancelar</Button>
          </Link>

          <Button type="submit" color="green">
            Publicar
          </Button>
        </footer>
      </form>
    </section>
  );
}

"use client";
import TextField from "~/infrastructure/components/ui/TextField";
import TextArea from "~/infrastructure/components/ui/TextArea";
import Button from "~/infrastructure/components/ui/Button";
import Link from "next/link";
import ImageVideoPicker from "~/infrastructure/components/ui/ImageVideoPicker";
import {
  MdPhone,
  MdTitle,
  MdOutlinePriceChange,
} from "react-icons/md";

import { useActionState, useState } from "react";
import { ActionState } from "~/infrastructure/types/Actions";
import { POST_CONTENT_MAX_LENGTH } from "~/infrastructure/constants";

export default function PublishForm({
  action,
}: {
  action: (state: ActionState, data: FormData) => Promise<typeof state>;
}) {
  const [state, createPostAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {
      errors: {},
      success: false,
      id: null,
      slug: null,
    }
  );
  const [imagePickerLabel, setImageVideoPickerLabel] = useState("Sube tu mejor imagen o sube tu mejor video")
  function onChangeImageVideoPicker() {
    setImageVideoPickerLabel("Cambia tu mejor imagen o cambia tu mejor video")
  }
  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">Publica algo sano</h1>

      {state?.errors?.errorMessage ? (
        <h2 className="pt-1 flex items-center gap-1 text-red-700 dark:text-red-400">
          {state.errors.errorMessage}
        </h2>
      ) : null}

      <form
        action={createPostAction}
        className=""
        aria-label="Publica tu nueva comida sana"
      >
        <TextField
          autoFocus
          required
          name="title"
          type="text"
          label="Título de la publicación:"
          icon={<MdTitle />}
          error={state?.errors?.title}
        />

        <TextField
          name="price"
          type="number"
          label="Precio:"
          icon={<MdOutlinePriceChange />}
          error={state?.errors?.price}
        />

        <ImageVideoPicker
          name="file"
          label={imagePickerLabel}
          onChange={onChangeImageVideoPicker}
          className="mb-6"
          error={state.errors?.image}
          accept="image/*,video/*"
          required
        />

        <TextField
          required
          name="phone"
          type="tel"
          label="Télefono"
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder="Ej: 278109216 o +522781092116"
          icon={<MdPhone />}
          error={state.errors?.phone}
        ></TextField>

        <TextArea
          name="content"
          required
          label="Descripción del producto:"
          rows={8}
          maxLength={Number(POST_CONTENT_MAX_LENGTH)}
          error={state?.errors?.content as string}
        />
        <footer className="flex justify-center gap-5 mt-4">
          <Link href="/">
            <Button>Cancelar</Button>
          </Link>

          <Button
            type="submit"
            color="green"
            isLoading={isPending && !state.success}
            disabled={isPending && !state.success}
          >
            {isPending && !state.success ? 'Publicando...' : 'Publicar'}
          </Button>
        </footer>
      </form>
    </section>
  );
}

"use client";
import TextField from "~/infrastructure/UI/components/TextField";
import TextArea from "~/infrastructure/UI/components/TextArea";
import Button from "~/infrastructure/UI/components/Button";
import Link from "next/link";
import { MdPhone, MdTitle, MdOutlinePriceChange } from "react-icons/md";

import { useActionState, useCallback, useState } from "react";
import { ActionState } from "~/infrastructure/types/Actions";
import { POST_CONTENT_MAX_LENGTH } from "~/infrastructure/constants";
import ImageVideoUploader from "./ui/ImageVideoUploader";

export default function PublishForm({
  action,
}: {
  action: (state: ActionState, data: FormData) => Promise<typeof state>;
}) {
  const [state, createPostAction, isPending] = useActionState<
    ActionState,
    FormData
  >(action, {
    errors: {},
    success: false,
    id: null,
    slug: null,
  });
  const [mediaJSON, setMediaJSON] = useState<string>("");
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean | null>(null);
  const [imagePickerLabel, setImageVideoPickerLabel] = useState(
    "Sube tu mejor imagen o sube tu mejor video"
  );

  const onUploadedCallback = useCallback(async function (
    data: Record<string, any> | null
  ) {
    setImageVideoPickerLabel("Cambia tu mejor imagen o cambia tu mejor video");
    try {
      setMediaJSON(JSON.stringify(data?.media));
      setIsLoadingMedia(data?.isLoading);
    } catch (error) {
      console.log(error);
    }
  },
  []);

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
          containerClassName="mb-6"
        />

        <TextField
          name="price"
          type="number"
          label="Precio:"
          icon={<MdOutlinePriceChange />}
          error={state?.errors?.price}
          containerClassName="mb-6"
        />

        <ImageVideoUploader
          label={imagePickerLabel}
          name={""}
          onUploaded={onUploadedCallback}
          className="mb-6"
          accept="image/*,video/*"
          required={false}
        />

        <input
          name="media"
          hidden
          defaultValue={mediaJSON}
          required={true}
        ></input>

        <TextField
          required
          name="phone"
          type="tel"
          label="Télefono"
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder="Ej: 278109216 o +522781092116"
          icon={<MdPhone />}
          error={state.errors?.phone}
          containerClassName="mb-6"
        ></TextField>

        <TextArea
          name="content"
          required
          label="Descripción del producto:"
          rows={8}
          maxLength={Number(POST_CONTENT_MAX_LENGTH)}
          error={state?.errors?.content as string}
          className="mb-6"
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
            {isPending && !state.success && isLoadingMedia
              ? "Publicando..."
              : "Publicar"}
          </Button>
        </footer>
      </form>
    </section>
  );
}

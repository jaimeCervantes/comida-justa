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
import { COMPRESSION_PRESETS } from "../publicar/ui/types/media.types";
import useStorageUpload from "../publicar/ui/hooks/useStorageUpload"; // ✅ importar como hook

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

  const [mediaJSON, setMediaJSON] = useState<string>("");
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [imagePickerLabel, setImageVideoPickerLabel] = useState("Sube tu mejor imagen o video");

  // ✅ Usar el hook dentro del componente
  const { uploadFile } = useStorageUpload();

  const onUploadedCallback = useCallback(
    async (data: any) => {
      if (!data?.media?.data) return;
      setIsLoadingMedia(true);

      try {
        const file = data.media.data;

         // Validar nombre y tipo MIME antes de continuar
        if (!(file instanceof File)) throw new Error("El archivo no es válido");
        
          if (!file.name || !file.type) {
            throw new Error("Nombre de archivo y tipo de contenido son requeridos");
        }
      
        console.log("Subiendo archivo:", file.name, file.type);

        const uploadedMedia: any = await uploadFile(file); // ✅ usar la función del hook

        if (uploadedMedia?.media?.url) {
          setMediaJSON(uploadedMedia.media.url);
          setImageVideoPickerLabel("Cambiar imagen o video");
        }
      } catch (err) {
        console.error("Error al subir el archivo comprimido:", err);
      } finally {
        setIsLoadingMedia(false);
      }
    },
    [uploadFile] // ✅ incluir en dependencias
  );

  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">Publica algo sano</h1>

      {state?.errors?.errorMessage && (
        <h2 className="pt-1 flex items-center gap-1 text-red-700 dark:text-red-400">
          {state.errors.errorMessage}
        </h2>
      )}

      <form action={createPostAction} aria-label="Publica tu nueva comida sana">
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

        <ImageVideoUploader
          mode="compress"
          label={imagePickerLabel}
          name=""
          onUploaded={onUploadedCallback}
          className="mb-6"
          accept="image/*,video/*"
          required={false}
          {...COMPRESSION_PRESETS.foodPost}
        />

        <input name="mediaUrl" hidden defaultValue={mediaJSON}/>

        <TextField
          required
          name="phone"
          type="tel"
          label="Teléfono"
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder="Ej: 278109216 o +522781092116"
          icon={<MdPhone />}
          error={state.errors?.phone}
        />

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
            isLoading={isPending && isLoadingMedia && !state.success}
            disabled={isPending && !state.success}
          >
            {isPending && isLoadingMedia ? "Publicando..." : "Publicar"}
          </Button>
        </footer>
      </form>
    </section>
  );
}
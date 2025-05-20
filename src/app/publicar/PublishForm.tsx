"use client";
import React, { useEffect, useState, useActionState } from "react";
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

import { ActionState } from "~/infrastructure/types/Actions";
import { POST_CONTENT_MAX_LENGTH } from "~/infrastructure/constants";
import ErrorModal from "~/infrastructure/components/ui/ErrorModal";


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
  const [showError, setShowError] = useState(true);
  const [titleError, setTitleError] = useState<string | null>(null);

    useEffect(() => {
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');

    const validateTitle = () => {
      const value = titleInput?.value.trim() || "";

      if (value.length > 0 && value.length < 4) {
        setTitleError("El título debe tener al menos 4 caracteres");

        if (titleInput && !titleInput.classList.contains("flash-border")) {
          titleInput.classList.add("flash-border");
          setTimeout(() => {
            titleInput.classList.remove("flash-border");
          }, 1800);
        }
      } else {
        setTitleError(null);
      }
    };

    titleInput?.addEventListener("input", validateTitle);

    return () => {
      titleInput?.removeEventListener("input", validateTitle);
    };
  }, []);

   useEffect(() => {
    if (state?.errors) {
      const firstErrorKey = Object.keys(state.errors).find(
        (key) => state.errors?.[key as keyof typeof state.errors]
      );
      if (firstErrorKey) {
        const inputWithError = document.querySelector(
          `[name="${firstErrorKey}"]`
        ) as HTMLElement | null;

        if (inputWithError) {
          inputWithError.scrollIntoView({ behavior: "smooth", block: "center" });
          inputWithError.focus();
          inputWithError.classList.add("flash-border");

          setTimeout(() => {
            inputWithError.classList.remove("flash-border");
          }, 1800);
        }
      }
    }
  }, [state?.errors]);

  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">Publica algo sano</h1>

      {state?.errors?.errorMessage && (
        <ErrorModal 
        message={state.errors.errorMessage} 
        onClose={() => setShowError(false)}
        />
)}

      <form
        action={createPostAction}
        className=""
        aria-label="Publica tu nueva comida sana"
      >
        <TextField
          autoFocus
          name="title"
          type="text"
          label="Título de la publicación:"
          icon={<MdTitle />}
          minLength={4}
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
          onChange={() => setImageVideoPickerLabel("Cambia tu imagen o video")}
          className="mb-6"
          error={state.errors?.file}
          accept="image/*,video/*"
        />

        <TextField
          name="phone"
          type="tel"
          label="Télefono"
          placeholder="Ej: 278109216 o +522781092116"
          icon={<MdPhone />}
          error={state.errors?.phone}
          pattern="\d+"
          title="El campo solo debe contener números"
        />

        <TextArea
          name="content"
          label="Descripción del producto:"
          rows={8}
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

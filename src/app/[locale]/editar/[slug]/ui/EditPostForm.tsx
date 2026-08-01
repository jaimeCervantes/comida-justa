"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdOutlinePriceChange, MdTitle } from "react-icons/md";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { POST_CONTENT_MAX_LENGTH } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { EditPostState } from "../actions";

const selectClassName =
  "w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-black dark:bg-gray-800 dark:text-white";

export type EditablePostValues = {
  slug: string;
  title: string;
  content: string;
  price: number | null;
  kind: string;
  category: string | null;
  subCategory: string | null;
};

/**
 * Edita el texto, el precio y la categoría de una publicación.
 *
 * **No se puede cambiar la media ni el tipo**: la primera exige rehacer la subida y el segundo
 * cambiaría lo que la publicación *es* (un anuncio no tiene precio). Ninguno de los dos hacía
 * falta para lo que este slice resuelve, que es corregir lo escrito y ajustar el precio.
 */
export default function EditPostForm({
  action,
  post,
  categoryOptions,
  subCategoryOptionsByCategory,
}: {
  action: (state: EditPostState, data: FormData) => Promise<EditPostState>;
  post: EditablePostValues;
  categoryOptions: readonly CategoryOption[];
  subCategoryOptionsByCategory: Record<string, readonly CategoryOption[]>;
}) {
  const t = useTranslations("edit");
  const tPublish = useTranslations("publish");
  const [state, updateAction, isPending] = useActionState<
    EditPostState,
    FormData
  >(action, {});
  const [category, setCategory] = useState<string>(post.category ?? "");

  const isProduct = post.kind === "producto";

  return (
    <section>
      <h1 className="text-xl mb-4">{t("heading")}</h1>

      {state.errorMessage ? (
        <p
          data-testid="edit-post-error"
          className="pt-1 mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form action={updateAction} aria-label={t("heading")}>
        <input type="hidden" name="slug" value={post.slug} />

        <TextField
          autoFocus
          required
          name="title"
          type="text"
          label={tPublish("title")}
          defaultValue={post.title}
          icon={<MdTitle />}
          containerClassName="mb-6"
        />

        {isProduct ? (
          <>
            <div className="mb-6 text-black dark:text-white">
              <label htmlFor="category" className="block mb-1">
                {tPublish("category")}
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={selectClassName}
              >
                <option value="">{tPublish("unspecifiedOption")}</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {category ? (
              <div className="mb-6 text-black dark:text-white">
                <label htmlFor="subCategory" className="block mb-1">
                  {tPublish("subCategory")}
                </label>
                <select
                  id="subCategory"
                  name="subCategory"
                  defaultValue={post.subCategory ?? ""}
                  className={selectClassName}
                >
                  <option value="">{tPublish("unspecifiedOption")}</option>
                  {(subCategoryOptionsByCategory[category] ?? []).map(
                    (option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            ) : null}

            <TextField
              required
              name="price"
              type="number"
              label={tPublish("price")}
              defaultValue={post.price ?? ""}
              icon={<MdOutlinePriceChange />}
              containerClassName="mb-6"
            />
          </>
        ) : null}

        <TextArea
          name="content"
          required
          label={t("content")}
          rows={8}
          defaultValue={post.content}
          maxLength={Number(POST_CONTENT_MAX_LENGTH)}
          className="mb-6"
        />

        <footer className="flex justify-center gap-5 mt-4">
          <Link href={`/${post.slug}`}>
            <Button>{tPublish("cancel")}</Button>
          </Link>

          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
          >
            {t("submit")}
          </Button>
        </footer>
      </form>
    </section>
  );
}

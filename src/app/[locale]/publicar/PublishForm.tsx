"use client";
import { useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";
import { MdOutlinePriceChange, MdPhone, MdTitle } from "react-icons/md";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { POST_CONTENT_MAX_LENGTH } from "~/infra/constants";
import type { ActionState } from "~/infra/types/Actions";
import ImageVideoUploader, {
  type UploadedMediaResult,
} from "~/infra/UI/components/ImageVideoUploader/ImageVideoUploader";
import { originOptionsFor } from "~/infra/UI/labels/postOriginLabels";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";

const selectClassName =
  "w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-black dark:bg-gray-800 dark:text-white";

export default function PublishForm({
  action,
  isAdmin = false,
  categoryOptions,
  subCategoryOptionsByCategory,
}: {
  action: (state: ActionState, data: FormData) => Promise<typeof state>;
  isAdmin?: boolean;
  /** Resueltas en el servidor desde la tabla `categories`, ya en el idioma de la ruta. */
  categoryOptions: readonly CategoryOption[];
  /** Las hijas de cada categoría, para encadenar el segundo selector. */
  subCategoryOptionsByCategory: Record<string, readonly CategoryOption[]>;
}) {
  const t = useTranslations("publish");
  const tVocabulary = useTranslations("vocabulary");
  const [state, createPostAction, isPending] = useActionState<
    ActionState,
    FormData
  >(action, {
    errors: {},
    success: false,
    id: null,
    slug: null,
  });
  const [kind, setKind] = useState<string>("anuncio");
  const [category, setCategory] = useState<string>("");
  const [mediaJSON, setMediaJSON] = useState<string>("");
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean | null>(null);
  const [imagePickerLabel, setImageVideoPickerLabel] = useState(t("media"));

  const onUploadedCallback = useCallback(
    async (data: UploadedMediaResult | null) => {
      setImageVideoPickerLabel(
        "Cambia tu mejor imagen o cambia tu mejor video",
      );
      try {
        setMediaJSON(JSON.stringify(data?.media));
        setIsLoadingMedia(data?.isLoading ?? null);
      } catch (error) {
        console.log(error);
      }
    },
    [],
  );

  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">{t("heading")}</h1>

      {state?.errors?.errorMessage ? (
        <h2 className="pt-1 flex items-center gap-1 text-red-700 dark:text-red-400">
          {state.errors.errorMessage}
        </h2>
      ) : null}

      <form action={createPostAction} className="" aria-label={t("formLabel")}>
        <TextField
          autoFocus
          required
          name="title"
          type="text"
          label={t("title")}
          icon={<MdTitle />}
          error={state?.errors?.title}
          containerClassName="mb-6"
        />

        <div className="mb-6 text-black dark:text-white">
          <label htmlFor="kind" className="block mb-1">
            {t("kind")}
          </label>
          <select
            id="kind"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className={selectClassName}
          >
            <option value="anuncio">{t("kindAnnouncement")}</option>
            <option value="producto">{t("kindProduct")}</option>
          </select>
        </div>

        {/* La categoría solo aplica a lo que se vende; en un anuncio sería ruido. */}
        {kind === "producto" ? (
          <>
            <div className="mb-6 text-black dark:text-white">
              <label htmlFor="category" className="block mb-1">
                {t("category")}
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={selectClassName}
              >
                <option value="">{t("unspecifiedOption")}</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sin categoría no hay sub-categoría que ofrecer: la base rechaza la huérfana. */}
            {category ? (
              <div className="mb-6 text-black dark:text-white">
                <label htmlFor="subCategory" className="block mb-1">
                  {t("subCategory")}
                </label>
                <select
                  id="subCategory"
                  name="subCategory"
                  defaultValue=""
                  className={selectClassName}
                >
                  <option value="">{t("unspecifiedOption")}</option>
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
          </>
        ) : null}

        {/* La procedencia solo aplica a lo que se vende, igual que la categoría. */}
        {kind === "producto" ? (
          <div className="mb-6 text-black dark:text-white">
            <label htmlFor="origin" className="block mb-1">
              {t("origin")}
            </label>
            <select
              id="origin"
              name="origin"
              defaultValue=""
              required
              className={selectClassName}
            >
              <option value="">{t("originPlaceholder")}</option>
              {originOptionsFor(isAdmin).map((option) => (
                <option key={option.value} value={option.value}>
                  {tVocabulary(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <TextField
          name="price"
          type="number"
          label={t("price")}
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
          label={t("phone")}
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder={t("phonePlaceholder")}
          icon={<MdPhone />}
          error={state.errors?.phone}
          containerClassName="mb-6"
        ></TextField>

        <TextArea
          name="content"
          required
          label={t("content")}
          rows={8}
          maxLength={Number(POST_CONTENT_MAX_LENGTH)}
          error={state?.errors?.content as string}
          className="mb-6"
        />
        <footer className="flex justify-center gap-5 mt-4">
          <Link href="/">
            <Button>{t("cancel")}</Button>
          </Link>

          <Button
            type="submit"
            color="green"
            isLoading={isPending && !state.success}
            disabled={isPending && !state.success}
          >
            {isPending && !state.success && isLoadingMedia
              ? t("submitting")
              : t("submit")}
          </Button>
        </footer>
      </form>
    </section>
  );
}

"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdOutlinePriceChange, MdPhone, MdTitle } from "react-icons/md";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import { POST_CONTENT_MAX_LENGTH } from "~/infra/constants";
import type { ActionState } from "~/infra/types/Actions";
import { originOptionsFor } from "~/infra/UI/labels/postOriginLabels";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import PostMediaField from "~/presentation/media/PostMediaField/PostMediaField";

export default function PublishForm({
  action,
  isAdmin = false,
  hasStore = true,
  categoryOptions,
  subCategoryOptionsByCategory,
}: {
  action: (state: ActionState, data: FormData) => Promise<typeof state>;
  isAdmin?: boolean;
  /**
   * Si quien publica ya abrió su tienda. Con `false` se le avisa —solo si se declara productor—
   * de que sin tienda con ubicación esa declaración no lo mete a productores locales.
   */
  hasStore?: boolean;
  /** Resueltas en el servidor desde la tabla `categories`, ya en el idioma de la ruta. */
  categoryOptions: readonly CategoryOption[];
  /** Las hijas de cada categoría, para encadenar el segundo selector. */
  subCategoryOptionsByCategory: Record<string, readonly CategoryOption[]>;
}) {
  const t = useTranslations("publish");
  const tCommon = useTranslations("common");
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
  const [origin, setOrigin] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean | null>(null);

  return (
    <section className="p-4">
      <h1 className="text-xl mb-4">{t("heading")}</h1>

      {/* Era un `<h2>` en rojo: sin `role`, un lector de pantalla no anunciaba nada, y quien no
          distingue el rojo no tenía forma de saber que aquello era un error. `Alert` pone el
          `role="alert"` que interrumpe y la etiqueta de texto que sobrevive sin percibir el color. */}
      {state?.errors?.errorMessage ? (
        <Alert tone="error" label={tCommon("alertError")} className="mb-4">
          {state.errors.errorMessage}
        </Alert>
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

        <Select
          id="kind"
          name="kind"
          label={t("kind")}
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          containerClassName="mb-6"
        >
          <option value="anuncio">{t("kindAnnouncement")}</option>
          <option value="producto">{t("kindProduct")}</option>
          <option value="evento">{t("kindEvent")}</option>
        </Select>

        {/*
          La categoría aplica a los dos kinds. Se ofrecía solo en `producto` por considerarla ruido
          en un anuncio, y el efecto era que los anuncios se guardaban con `category` en null: no
          hay forma de saber a qué pilar pertenece un anuncio sin categoría, así que ninguna pantalla
          de pilar podía mostrarlos y todos acababan solo en el feed general.
        */}
        <Select
          id="category"
          name="category"
          label={t("category")}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          containerClassName="mb-6"
        >
          <option value="">{t("unspecifiedOption")}</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Sin categoría no hay sub-categoría que ofrecer: la base rechaza la huérfana. */}
        {category ? (
          <Select
            id="subCategory"
            name="subCategory"
            label={t("subCategory")}
            defaultValue=""
            containerClassName="mb-6"
          >
            <option value="">{t("unspecifiedOption")}</option>
            {(subCategoryOptionsByCategory[category] ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}

        {/* La procedencia solo aplica a lo que se vende, igual que la categoría. */}
        {kind === "producto" ? (
          <div className="mb-6">
            <Select
              id="origin"
              name="origin"
              label={t("origin")}
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              required
            >
              <option value="">{t("originPlaceholder")}</option>
              {originOptionsFor(isAdmin).map((option) => (
                <option key={option.value} value={option.value}>
                  {tVocabulary(option.labelKey)}
                </option>
              ))}
            </Select>

            {/*
              Solo para quien se declara productor sin tener tienda. Es el único caso en que lo
              que acaba de elegir no significa nada todavía: sin tienda con ubicación no hay
              distancia que verificar y no entra a productores locales. No bloquea nada, y dice
              que puede publicar primero porque al abrir la tienda esto se cuelga solo.
            */}
            {!hasStore && origin === "productor" ? (
              <p
                data-testid="producer-needs-store"
                className="mt-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {t("producerNeedsStore")}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Solo un evento ocurre en un momento, así que solo ahí se pregunta. La fecha es
            obligatoria porque es lo que lo hace evento; la de fin es opcional, y sin ella el evento
            caduca en su hora de inicio (ver `domain/entities/post/event.ts`). */}
        {kind === "evento" ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <TextField
              required
              name="startsAt"
              type="datetime-local"
              label={t("startsAt")}
              error={state?.errors?.startsAt}
            />
            <TextField
              name="endsAt"
              type="datetime-local"
              label={t("endsAt")}
              error={state?.errors?.endsAt}
            />
          </div>
        ) : null}

        <TextField
          name="price"
          type="number"
          label={kind === "evento" ? t("priceOptional") : t("price")}
          icon={<MdOutlinePriceChange />}
          error={state?.errors?.price}
          containerClassName="mb-6"
        />

        <PostMediaField onLoadingChange={setIsLoadingMedia} />

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

"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdOutlinePriceChange, MdPhone, MdTitle } from "react-icons/md";
import { EVENT_KIND, SERVICE_KIND } from "~/domain/entities/post/kind";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { formatDateTimeLocalInTimeZone } from "~/domain/schedule/localDateTime";
import { Link } from "~/i18n/navigation";
import {
  POST_CONTENT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  SITE_CURRENCY,
} from "~/infra/constants";
import { originOptionsFor } from "~/infra/UI/labels/postOriginLabels";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import PostMediaField, {
  type PostMediaFieldItem,
} from "~/presentation/media/PostMediaField/PostMediaField";
import EventTimeZoneField, {
  useBrowserTimeZone,
} from "~/presentation/post/EventTimeZone/EventTimeZoneField";
import { usePostValidationMessages } from "~/presentation/post/usePostValidationMessages";
import type { EditPostState } from "../actions";

export type EditablePostValues = {
  slug: string;
  title: string;
  content: string;
  contactPhone: string | null;
  price: number | null;
  kind: string;
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  durationMinutes: number | null;
  /** Los archivos que ya tiene, en su orden. El primero es la portada. */
  media: PostMediaFieldItem[];
};

/**
 * Edita el texto, el precio, la categoría, la procedencia y los archivos de una publicación.
 *
 * **El tipo sigue sin poder cambiarse**: cambiaría lo que la publicación *es* (un anuncio no tiene
 * precio). Los archivos sí, desde este slice: es el mismo `PostMediaField` que pinta `/publicar`, así
 * que añadir, quitar y reordenar se comportan igual en las dos pantallas y hay un solo sitio donde
 * arreglarlo. Antes esta pantalla ni los mostraba, y corregir una foto equivocada exigía volver a
 * publicar entera la ficha.
 */
export default function EditPostForm({
  action,
  post,
  isAdmin = false,
  categoryOptions,
  subCategoryOptionsByCategory,
}: {
  action: (state: EditPostState, data: FormData) => Promise<EditPostState>;
  post: EditablePostValues;
  isAdmin?: boolean;
  categoryOptions: readonly CategoryOption[];
  subCategoryOptionsByCategory: Record<string, readonly CategoryOption[]>;
}) {
  const t = useTranslations("edit");
  const tCommon = useTranslations("common");
  const tPublish = useTranslations("publish");
  const tVocabulary = useTranslations("vocabulary");
  const [state, updateAction, isPending] = useActionState<
    EditPostState,
    FormData
  >(action, {});
  const [category, setCategory] = useState<string>(post.category ?? "");
  const timeZone = useBrowserTimeZone();
  const fieldMessages = usePostValidationMessages();

  const isProduct = post.kind === "producto";
  const isEvent = post.kind === EVENT_KIND;
  const isService = post.kind === SERVICE_KIND;
  const showsPrice = isProduct || isEvent || isService;
  const errorMessage = state.errors?.errorMessage ?? state.errorMessage;
  /* Igual que al publicar: sólo cambia cuando la acción rechaza algún campo, y es lo que hace
     saltar el foco hasta él en vez de dejar el mensaje arriba y a la persona abajo. */
  const serverRejection = Object.values(state.errors ?? {}).some(Boolean)
    ? state
    : null;

  return (
    <section>
      <Heading level={1} className="mb-4">
        {t("heading")}
      </Heading>

      {errorMessage ? (
        <Alert
          tone="error"
          label={tCommon("alertError")}
          data-testid="edit-post-error"
          className="mb-4"
        >
          {errorMessage}
        </Alert>
      ) : null}

      <ValidatedForm
        action={updateAction}
        serverErrorSignal={serverRejection}
        aria-label={t("heading")}
      >
        <input type="hidden" name="slug" value={post.slug} />
        <input type="hidden" name="kind" value={post.kind} />

        <TextField
          autoFocus
          required
          name="title"
          type="text"
          label={tPublish("title")}
          defaultValue={post.title}
          /* El mismo tope que al publicar. Un límite que solo existe en una de las dos pantallas
             no es un límite: se esquiva editando. */
          maxLength={POST_TITLE_MAX_LENGTH}
          icon={<MdTitle />}
          error={state.errors?.title}
          validationMessages={fieldMessages.title}
          containerClassName="mb-6"
        />

        <Select
          id="kind"
          name="kind"
          label={tPublish("kind")}
          value={post.kind}
          disabled
          containerClassName="mb-6"
        >
          <option value="anuncio">{tPublish("kindAnnouncement")}</option>
          <option value="producto">{tPublish("kindProduct")}</option>
          <option value="evento">{tPublish("kindEvent")}</option>
          <option value="servicio">{tPublish("kindService")}</option>
        </Select>

        {/*
          La categoría aplica a los dos kinds, igual que al publicar. Es por aquí por donde el
          anuncio anterior a la regla, que quedó con `category` en null y por eso no aparecía en
          ninguna pantalla de pilar, puede ponerse al día.
        */}
        <Select
          id="category"
          name="category"
          label={tPublish("category")}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          containerClassName="mb-6"
        >
          <option value="">{tPublish("unspecifiedOption")}</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {category ? (
          <Select
            id="subCategory"
            name="subCategory"
            label={tPublish("subCategory")}
            defaultValue={post.subCategory ?? ""}
            containerClassName="mb-6"
          >
            <option value="">{tPublish("unspecifiedOption")}</option>
            {(subCategoryOptionsByCategory[category] ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}

        {isProduct ? (
          <>
            {/* Requerida como al publicar: es por aquí por donde el producto anterior a la
                regla, que quedó sin procedencia, puede ponerse al día. */}
            <Select
              id="origin"
              name="origin"
              label={tPublish("origin")}
              defaultValue={post.origin ?? ""}
              required
              error={state.errors?.origin}
              validationMessages={fieldMessages.origin}
              containerClassName="mb-6"
            >
              <option value="">{tPublish("originPlaceholder")}</option>
              {originOptionsFor(isAdmin).map((option) => (
                <option key={option.value} value={option.value}>
                  {tVocabulary(option.labelKey)}
                </option>
              ))}
            </Select>
          </>
        ) : null}

        {isEvent ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <EventTimeZoneField timeZone={timeZone} />
            <TextField
              key={`startsAt-${timeZone}`}
              required
              name="startsAt"
              type="datetime-local"
              label={tPublish("startsAt")}
              error={state.errors?.startsAt}
              validationMessages={fieldMessages.startsAt}
              defaultValue={formatDateTimeLocalInTimeZone(
                post.startsAt,
                timeZone,
              )}
            />
            <TextField
              key={`endsAt-${timeZone}`}
              name="endsAt"
              type="datetime-local"
              label={tPublish("endsAt")}
              error={state.errors?.endsAt}
              defaultValue={formatDateTimeLocalInTimeZone(
                post.endsAt,
                timeZone,
              )}
            />
          </div>
        ) : null}

        {isService ? (
          <TextField
            required
            name="durationMinutes"
            type="number"
            inputMode="numeric"
            min="5"
            step="5"
            label={tPublish("durationMinutes")}
            defaultValue={post.durationMinutes ?? ""}
            error={state.errors?.durationMinutes}
            validationMessages={fieldMessages.durationMinutes}
            containerClassName="mb-6"
          />
        ) : null}

        {showsPrice ? (
          <TextField
            required={isProduct || isService}
            name="price"
            type="number"
            inputMode="numeric"
            label={isEvent ? tPublish("priceOptional") : tPublish("price")}
            defaultValue={post.price ?? ""}
            icon={<MdOutlinePriceChange />}
            /* La moneda, escrita, igual que al publicar: un número suelto no dice en qué está. */
            trailingAdornment={
              <span className="text-label text-text-support">
                {SITE_CURRENCY}
              </span>
            }
            min={isProduct || isService ? "1" : "0"}
            step="1"
            error={state.errors?.price}
            validationMessages={fieldMessages.price}
            containerClassName="mb-6"
          />
        ) : null}

        <TextArea
          name="content"
          required
          label={t("content")}
          rows={8}
          error={state.errors?.content}
          validationMessages={fieldMessages.content}
          defaultValue={post.content}
          maxLength={Number(POST_CONTENT_MAX_LENGTH)}
          className="mb-6"
        />

        <PostMediaField error={state.errors?.media} initialItems={post.media} />

        <TextField
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          label={tPublish("phone")}
          defaultValue={post.contactPhone ?? ""}
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder={tPublish("phonePlaceholder")}
          icon={<MdPhone />}
          error={state.errors?.phone}
          validationMessages={fieldMessages.phone}
          containerClassName="mb-6"
        />

        <footer className="flex justify-center gap-5 mt-4">
          <Link href={{ pathname: "/[slug]", params: { slug: post.slug } }}>
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
      </ValidatedForm>
    </section>
  );
}

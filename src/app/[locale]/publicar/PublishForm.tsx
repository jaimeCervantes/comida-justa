"use client";
import { useTranslations } from "next-intl";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MdOutlinePriceChange, MdPhone, MdTitle } from "react-icons/md";
import { EVENT_KIND, SERVICE_KIND } from "~/domain/entities/post/kind";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Link } from "~/i18n/navigation";
import {
  POST_CONTENT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  SITE_CURRENCY,
} from "~/infra/constants";
import type { ActionState } from "~/infra/types/Actions";
import { originOptionsFor } from "~/infra/UI/labels/postOriginLabels";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { SegmentedField } from "~/presentation/design_system/forms/SegmentedField";
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
import RouteFileField from "~/presentation/post/RouteFileField/RouteFileField";
import { usePostValidationMessages } from "~/presentation/post/usePostValidationMessages";
import { publishRequiresPrice, publishShowsPrice } from "./publishChecklist";
import { PUBLISH_KIND_OPTIONS, publishKindTestId } from "./publishKinds";
import {
  firstStepWithAnyField,
  indexOfStep,
  PUBLISH_STEPS,
  stepForField,
} from "./publishSteps";
import PublishChecklist from "./ui/PublishChecklist";
import PublishPreview from "./ui/PublishPreview";
import PublishStepper from "./ui/PublishStepper";
import { usePublishDraft } from "./usePublishDraft";

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
  /**
   * Un eco de la lista de `PostMediaField`, **solo para enseñarla** en la vista previa.
   *
   * La lista sigue viviendo allí: es quien la edita y quien la serializa al campo oculto. Aquí no
   * se toca — se mira. Duplicar el estado para poder escribirlo desde dos sitios sería otra cosa, y
   * sería un error.
   */
  const [mediaItems, setMediaItems] = useState<readonly PostMediaFieldItem[]>(
    [],
  );
  const [step, setStep] = useState(0);
  /**
   * El campo que hay que enfocar **cuando su paso ya esté en pantalla**.
   *
   * `Form` avisa de cuál rechazó y luego lo enfoca, pero si vive en otro paso ese `focus()` cae en
   * algo con `hidden` y no se ve nada. Así que aquí se cambia de paso y se apunta el nombre; el
   * efecto de abajo lo enfoca cuando React ya ha pintado el paso nuevo.
   */
  const [fieldToReveal, setFieldToReveal] = useState<string | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const timeZone = useBrowserTimeZone();
  const fieldMessages = usePostValidationMessages();
  /* Cambia sólo cuando la acción contesta con algún error de campo: es lo que hace saltar el
     foco al primero. Sin esto el mensaje se pinta y la persona se queda donde estaba. */
  const serverRejection = Object.values(state?.errors ?? {}).some(Boolean)
    ? state
    : null;
  /* El servidor también rechaza, y sus errores llegan por `state.errors`: si el primero vive en
     otro paso, hay que ir a por él igual que con los del navegador. */
  useEffect(() => {
    const rejected = Object.entries(state?.errors ?? {})
      .filter(([, message]) => Boolean(message))
      .map(([name]) => name);

    if (rejected.length === 0) return;

    const target = firstStepWithAnyField(rejected);
    if (target) setStep(indexOfStep(target));
  }, [state]);

  useEffect(() => {
    if (!fieldToReveal) return;

    const control = stepsRef.current?.querySelector<HTMLElement>(
      `[name="${fieldToReveal}"]`,
    );

    control?.focus({ preventScroll: true });
    control?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    setFieldToReveal(null);
  }, [fieldToReveal]);

  /**
   * Llevar a un campo, venga de donde venga la petición.
   *
   * Lo usan los puntos del checklist —«te falta el teléfono», y pulsar lleva allí—, y hace las dos
   * cosas que hacen falta cuando el campo puede estar en otro paso: cambiar de paso y, cuando ese
   * paso ya esté pintado, enfocarlo. El foco no se puede pedir aquí porque el campo todavía está
   * tras un `hidden`; de eso se encarga el efecto de `fieldToReveal`.
   */
  const goToField = useCallback((field: string) => {
    const target = stepForField(field);
    if (target) setStep(indexOfStep(target));
    setFieldToReveal(field);
  }, []);

  const isProduct = kind === "producto";
  const isEvent = kind === EVENT_KIND;
  const isService = kind === SERVICE_KIND;
  /* La regla del precio se importa en vez de escribirse aquí: el checklist la necesita también, y
     con una copia acabaría pidiendo un precio que esta pantalla no exige. */
  const showsPrice = publishShowsPrice(kind);
  const requiresPrice = publishRequiresPrice(kind);

  const draft = usePublishDraft({
    scope: stepsRef,
    kind,
    category,
    mediaCount: mediaItems.length,
  });

  return (
    <section className="p-4">
      <Heading level={1} className="mb-4">
        {t("heading")}
      </Heading>

      {/* Era un `<h2>` en rojo: sin `role`, un lector de pantalla no anunciaba nada, y quien no
          distingue el rojo no tenía forma de saber que aquello era un error. `Alert` pone el
          `role="alert"` que interrumpe y la etiqueta de texto que sobrevive sin percibir el color. */}
      {state?.errors?.errorMessage ? (
        <Alert tone="error" label={tCommon("alertError")} className="mb-4">
          {state.errors.errorMessage}
        </Alert>
      ) : null}

      {/*
        Dos columnas donde caben, una donde no. El formulario no lleva `max-w-*`: el ancho lo pone
        el `container-width` del layout, y lo que sobra se reparte en columnas en vez de dejarse en
        blanco a los lados.
      */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ValidatedForm
          action={createPostAction}
          serverErrorSignal={serverRejection}
          aria-label={t("formLabel")}
        >
          <PublishStepper current={step} onGoTo={setStep} />
          <div ref={stepsRef}>
            <div hidden={step !== 0} data-testid="publish-fields-essentials">
              <TextField
                autoFocus
                required
                name="title"
                type="text"
                label={t("title")}
                labelSuffix={t("titleCounter", {
                  count: draft.title.length,
                  max: POST_TITLE_MAX_LENGTH,
                })}
                hint={t("titleHint")}
                maxLength={POST_TITLE_MAX_LENGTH}
                icon={<MdTitle />}
                error={state?.errors?.title}
                validationMessages={fieldMessages.title}
                containerClassName="mb-6"
              />

              {/* Cuatro opciones no se esconden detrás de un desplegable. Es además la primera
                  decisión del formulario y la que decide qué campos aparecen después —precio,
                  fecha, duración, procedencia—, así que verlas todas ahorra el «a ver qué sale». */}
              <SegmentedField
                name="kind"
                label={t("kind")}
                value={kind}
                onChange={setKind}
                containerClassName="mb-6"
                options={PUBLISH_KIND_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                  testId: publishKindTestId(option.value),
                }))}
              />

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
                  {(subCategoryOptionsByCategory[category] ?? []).map(
                    (option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ),
                  )}
                </Select>
              ) : null}
            </div>

            <div hidden={step !== 1} data-testid="publish-fields-details">
              {/* La procedencia solo aplica a lo que se vende, igual que la categoría. */}
              {isProduct ? (
                <div className="mb-6">
                  <Select
                    id="origin"
                    name="origin"
                    label={t("origin")}
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    required
                    error={state?.errors?.origin}
                    validationMessages={fieldMessages.origin}
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
                      className="mt-2 text-sm text-text-support"
                    >
                      {t("producerNeedsStore")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Solo un evento ocurre en un momento, así que solo ahí se pregunta. La fecha es
            obligatoria porque es lo que lo hace evento; la de fin es opcional, y sin ella el evento
            caduca en su hora de inicio (ver `domain/entities/post/event.ts`). */}
              {isEvent ? (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <EventTimeZoneField timeZone={timeZone} />
                  <TextField
                    required
                    name="startsAt"
                    type="datetime-local"
                    label={t("startsAt")}
                    error={state?.errors?.startsAt}
                    validationMessages={fieldMessages.startsAt}
                  />
                  <TextField
                    name="endsAt"
                    type="datetime-local"
                    label={t("endsAt")}
                    error={state?.errors?.endsAt}
                  />

                  {/* El GPX no se guarda: se lee, se saca el trazo y se tira. Y se lee **en el
                navegador**: mandar el archivo entero reventaba con `Body exceeded 1 MB limit` para
                que el servidor descartara el 96% de sus puntos. Lo que viaja son los 2.000 que se
                guardan. Ver `domain/entities/post/routeFile.ts`. */}
                  <RouteFileField
                    className="sm:col-span-2"
                    error={state?.errors?.route}
                  />
                </div>
              ) : null}

              {/* Un servicio se agenda, y agendar es repartir el tiempo del proveedor: la duración es
            lo que convertirá "las 9:00" en "de 9:00 a 9:45". Se pide ya, aunque la agenda no
            exista, para que ningún servicio nazca sin ella. */}
              {isService ? (
                <TextField
                  required
                  name="durationMinutes"
                  type="number"
                  inputMode="numeric"
                  min="5"
                  step="5"
                  label={t("durationMinutes")}
                  error={state?.errors?.durationMinutes}
                  validationMessages={fieldMessages.durationMinutes}
                  containerClassName="mb-6"
                />
              ) : null}

              {showsPrice ? (
                <TextField
                  required={requiresPrice}
                  name="price"
                  type="number"
                  inputMode="numeric"
                  min={requiresPrice ? "1" : "0"}
                  step="1"
                  label={isEvent ? t("priceOptional") : t("price")}
                  icon={<MdOutlinePriceChange />}
                  trailingAdornment={
                    <span className="text-label text-text-support">
                      {SITE_CURRENCY}
                    </span>
                  }
                  error={state?.errors?.price}
                  validationMessages={fieldMessages.price}
                  containerClassName="mb-6"
                />
              ) : null}
            </div>

            <div hidden={step !== 2} data-testid="publish-fields-contact">
              <PostMediaField
                error={state?.errors?.media}
                onLoadingChange={setIsLoadingMedia}
                onItemsChange={setMediaItems}
              />

              <TextField
                required
                name="phone"
                type="tel"
                autoComplete="tel"
                label={t("phone")}
                pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
                placeholder={t("phonePlaceholder")}
                icon={<MdPhone />}
                error={state.errors?.phone}
                validationMessages={fieldMessages.phone}
                containerClassName="mb-6"
              ></TextField>

              <TextArea
                name="content"
                required
                label={t("content")}
                rows={8}
                maxLength={Number(POST_CONTENT_MAX_LENGTH)}
                error={state?.errors?.content as string}
                validationMessages={fieldMessages.content}
                className="mb-6"
              />
            </div>
          </div>

          {/*
          **Publicar solo existe en el último paso, y es a propósito.**

          Con el botón en los tres, enviar desde el primero dejaba los errores de los otros dos tras
          un `hidden`: se leía «el título es obligatorio» y nada decía que faltaban el teléfono y la
          descripción. Se intentó marcarlos en la barra de pasos —por evento `invalid`, por un
          gancho en `Form` y consultando el DOM al pulsar— y ninguna de las tres llegaba en un
          navegador de verdad, aunque las tres funcionaran en jsdom. Enviar un mecanismo que solo
          funciona en las pruebas es peor que no tenerlo.

          Así que el asistente hace lo que dibuja el 5.3: se avanza con «Continuar» y se publica al
          final, cuando ya se han visto los tres pasos. Los puntos del `PublishStepper` siguen
          navegando libremente para quien quiera volver, y un rechazo del servidor sigue llevando al
          paso que contiene el campo.
        */}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-6">
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  data-testid="publish-back"
                >
                  {t("stepBack")}
                </Button>
              ) : (
                <Link href="/">
                  <Button type="button">{t("cancel")}</Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < PUBLISH_STEPS.length - 1 ? (
                <Button
                  type="button"
                  color="green"
                  onClick={() => setStep(step + 1)}
                  data-testid="publish-next"
                >
                  {t("stepNext")}
                </Button>
              ) : (
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
              )}
            </div>
          </footer>
        </ValidatedForm>

        {/*
          La columna del 5.3, solo donde hay sitio al lado del formulario.

          El propio canvas la quita en su maqueta de teléfono, y con razón: apilada, caería
          **debajo** del botón de publicar, que es donde nadie mira. En un teléfono quien lleva la
          cuenta es el asistente —«paso 2 de 3» y el botón que dice qué toca ahora—; aquí, donde el
          formulario no llena el ancho, el hueco se gana enseñando lo que se está construyendo.

          Es `sticky` porque su valor es acompañar: una vista previa que se queda arriba mientras se
          escribe el tercer paso no es una vista previa, es un encabezado.
        */}
        <aside
          data-testid="publish-aside"
          className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6"
        >
          <PublishPreview
            draft={draft}
            cover={mediaItems[0] ?? null}
            categoryOptions={categoryOptions}
          />
          <PublishChecklist draft={draft} onGoToField={goToField} />
        </aside>
      </div>
    </section>
  );
}

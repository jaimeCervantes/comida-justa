"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { parseGpx } from "~/domain/entities/post/gpx";
import {
  MAX_ROUTE_FILE_BYTES,
  ROUTE_FILE_EXTENSION,
  ROUTE_REMOVED,
  serializeRoute,
} from "~/domain/entities/post/routeFile";
import RouteFileError from "~/domain/errors/RouteFileError";
import { ROUTE_FILE_ERROR_KEYS } from "~/infra/UI/labels/routeFileErrorKeys";

/**
 * El recorrido de un evento: **se lee aquí y al servidor le viajan los puntos**, no el archivo.
 *
 * El `.gpx` iba dentro del cuerpo de la Server Action y en producción eso reventaba con
 * `Body exceeded 1 MB limit` (413), perdiendo todo lo que la persona había escrito. Del archivo solo
 * interesan sus puntos —`parseGpx` recorta a 2.000 y eso es lo único que llega a `post_routes`—, así
 * que mandarlo entero era pagar megabytes para que el servidor tirase casi todos. Interpretarlo aquí
 * deja la petición en unos 88 KB venga el archivo de donde venga. Ver `domain/…/routeFile.ts`.
 *
 * El regalo de haberlo movido: **el error se ve al elegir el archivo**, no después de enviar el
 * formulario. Quien exporta el archivo equivocado se entera antes de escribir nada.
 *
 * Es opcional: una rodada sin GPX sigue siendo una rodada, así que sin archivo el campo va vacío y la
 * acción no busca ningún recorrido.
 */
/**
 * El texto del archivo, con `FileReader` y no con `file.text()`.
 *
 * `Blob.text()` es más corto y hace lo mismo, pero **no existe en jsdom**, así que con él la prueba
 * de este componente no puede ejercitar lo único que importa aquí: que lo que acaba en el formulario
 * son los puntos y no el archivo. `FileReader` es además lo que ya usa `ImageVideoPicker`.
 */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read-failed"));
    reader.readAsText(file);
  });
}

/** El recorrido que la publicación ya tiene guardado. Sólo al editar. */
export interface ExistingRoute {
  /** Metros, tal y como salieron de `post_routes`. Se enseñan en kilómetros. */
  lengthMeters: number;
  /** Cuántos puntos traía el archivo original, que es lo que dice si el trazo es fino o burdo. */
  sourcePoints: number;
}

export default function RouteFileField({
  name = "route",
  existingRoute = null,
  error,
  className,
}: {
  /**
   * El campo oculto que lee la Server Action. Lleva los puntos en JSON, la marca de
   * {@link ROUTE_REMOVED}, o nada — y esas tres cosas piden tres cosas distintas.
   */
  name?: string;
  /**
   * La que ya tiene la publicación. `null` al publicar, que es cuando no hay ninguna.
   *
   * **No trae el nombre del archivo, y no es un olvido**: el `.gpx` no se guarda en ningún sitio —se
   * lee en el navegador, se extraen sus puntos y se tira—, así que meses después lo único que se
   * sabe del recorrido es su forma. Se enseña lo que hay: cuánto mide y con cuántos puntos.
   */
  existingRoute?: ExistingRoute | null;
  /** Lo que contestó la acción sobre este archivo, ya traducido. */
  error?: string | null;
  className?: string;
}) {
  const t = useTranslations("publish");
  const input = useRef<HTMLInputElement>(null);
  const [payload, setPayload] = useState<string>("");
  const [summary, setSummary] = useState<{
    fileName: string;
    kilometres: string;
    points: number;
  } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  /**
   * Si la ruta guardada sigue en pie.
   *
   * Empieza en `true` cuando hay una y sólo cae por un gesto explícito. Elegir un archivo nuevo no
   * la «quita»: la reemplaza, que para el servidor es la misma operación de siempre —un `save`— y
   * para quien mira es otra cosa distinta de quedarse sin recorrido.
   */
  const [keepsExisting, setKeepsExisting] = useState(existingRoute !== null);

  const read = useCallback(
    async (file: File | undefined) => {
      setProblem(null);
      setSummary(null);
      setPayload("");

      if (!file) return;

      /* Antes de leerlo, no después: leerlo es reservar su tamaño en el teléfono de quien publica,
         y de un archivo absurdo lo correcto es decirlo, no quedarse pensando. */
      if (file.size > MAX_ROUTE_FILE_BYTES) {
        setProblem(t(ROUTE_FILE_ERROR_KEYS["too-large"]));
        return;
      }

      try {
        const route = parseGpx(await readAsText(file));

        setPayload(serializeRoute(route));
        setSummary({
          fileName: file.name,
          kilometres: (route.meters / 1000).toFixed(1),
          points: route.originalPoints,
        });
        // El archivo nuevo reemplaza a la guardada: dejan de enseñarse las dos a la vez.
        setKeepsExisting(false);
      } catch (caught) {
        /* Un problema del archivo se cuenta; cualquier otra cosa es un fallo de verdad y no se
           disfraza de "tu archivo está mal". */
        if (!(caught instanceof RouteFileError)) throw caught;

        setProblem(t(ROUTE_FILE_ERROR_KEYS[caught.problem]));
      }
    },
    [t],
  );

  /**
   * Deshace la elección del archivo.
   *
   * Al publicar deja el campo vacío. **Al editar significa «me arrepentí del cambio»**, así que la
   * ruta guardada vuelve a estar en pie: quien quita el archivo que acaba de elegir no está pidiendo
   * quedarse sin recorrido, está cancelando el reemplazo.
   */
  const clear = useCallback(() => {
    setPayload("");
    setSummary(null);
    setProblem(null);
    setKeepsExisting(existingRoute !== null);
    // Sin esto, volver a elegir el mismo archivo no dispara ningún `change`.
    if (input.current) input.current.value = "";
  }, [existingRoute]);

  /** Quitar la que ya estaba. Es el único gesto que deja la publicación sin recorrido. */
  const removeExisting = useCallback(() => {
    setPayload(ROUTE_REMOVED);
    setSummary(null);
    setProblem(null);
    setKeepsExisting(false);
    if (input.current) input.current.value = "";
  }, []);

  /** Devolverla, mientras no se haya guardado. Quitar algo sin vuelta atrás es una trampa. */
  const undoRemoval = useCallback(() => {
    setPayload("");
    setKeepsExisting(true);
  }, []);

  return (
    <div className={className}>
      <label className="block">
        <span className="block mb-1">{t("route")}</span>
        <input
          ref={input}
          type="file"
          accept={ROUTE_FILE_EXTENSION}
          data-testid="route-file"
          className="block w-full text-sm"
          onChange={(event) => read(event.target.files?.[0])}
        />
      </label>

      {/* Tres estados y sólo uno a la vez: el archivo recién elegido, la ruta que ya estaba, o el
          aviso de que se va a quitar. La pista general sólo aparece cuando no hay ninguna, que es
          cuando de verdad hace falta explicar para qué sirve el campo. */}
      {summary ? (
        <p className="mt-1 text-sm" data-testid="route-summary">
          {t("routeReady", {
            fileName: summary.fileName,
            kilometres: summary.kilometres,
            points: summary.points,
          })}{" "}
          <button
            type="button"
            onClick={clear}
            data-testid="route-remove"
            className="underline"
          >
            {t("routeRemove")}
          </button>
        </p>
      ) : keepsExisting && existingRoute ? (
        <p className="mt-1 text-sm" data-testid="route-existing">
          {t("routeExisting", {
            kilometres: (existingRoute.lengthMeters / 1000).toFixed(1),
            points: existingRoute.sourcePoints,
          })}{" "}
          <button
            type="button"
            onClick={removeExisting}
            data-testid="route-remove-existing"
            className="underline"
          >
            {t("routeRemoveExisting")}
          </button>
        </p>
      ) : payload === ROUTE_REMOVED ? (
        <p className="mt-1 text-sm" data-testid="route-removed">
          {t("routeWillBeRemoved")}{" "}
          <button
            type="button"
            onClick={undoRemoval}
            data-testid="route-undo-removal"
            className="underline"
          >
            {t("routeUndoRemoval")}
          </button>
        </p>
      ) : (
        <span className="block mt-1 text-sm text-text-support">
          {t("routeHint")}
        </span>
      )}

      {/* El del navegador manda: si acaba de rechazar el archivo, repetir además lo que contestó la
          acción sobre el anterior sería enseñar dos errores para un solo campo. */}
      {problem || error ? (
        <span className="block mt-1 text-sm text-feedback-error">
          {problem ?? error}
        </span>
      ) : null}

      {/* Los puntos ya reducidos. El archivo se queda en el navegador. */}
      <input name={name} hidden readOnly value={payload} />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { parseGpx } from "~/domain/entities/post/gpx";
import {
  MAX_ROUTE_FILE_BYTES,
  ROUTE_FILE_EXTENSION,
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

export default function RouteFileField({
  name = "route",
  error,
  className,
}: {
  /** El campo oculto que lee la Server Action. Lleva los puntos en JSON, o nada. */
  name?: string;
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
      } catch (caught) {
        /* Un problema del archivo se cuenta; cualquier otra cosa es un fallo de verdad y no se
           disfraza de "tu archivo está mal". */
        if (!(caught instanceof RouteFileError)) throw caught;

        setProblem(t(ROUTE_FILE_ERROR_KEYS[caught.problem]));
      }
    },
    [t],
  );

  const clear = useCallback(() => {
    setPayload("");
    setSummary(null);
    setProblem(null);
    // Sin esto, volver a elegir el mismo archivo no dispara ningún `change`.
    if (input.current) input.current.value = "";
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
      ) : (
        <span className="block mt-1 text-sm text-gray-500 dark:text-gray-400">
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

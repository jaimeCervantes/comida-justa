import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MAX_REDUCED_ROUTE_POINTS } from "~/domain/entities/post/gpx";
import { MAX_ROUTE_FILE_BYTES } from "~/domain/entities/post/routeFile";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import RouteFileField from "./RouteFileField";

/**
 * Sin dobles: el componente usa `parseGpx` de verdad, que es código puro.
 *
 * Es lo que hace que esta prueba cubra lo que el cambio vino a arreglar —qué acaba en el POST— en
 * vez de solo cablear un mock. Lo único que se simula es el archivo, que es un `File` del navegador.
 */
function gpxWith(points: Array<[number, number]>): string {
  const trkpts = points
    .map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join("");

  return `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>${trkpts}</trkseg></trk></gpx>`;
}

/** Una ruta con `count` puntos, separados lo justo para que sume metros de verdad. */
function longRoute(count: number): string {
  return gpxWith(
    Array.from(
      { length: count },
      (_, i) => [19 + i / 100_000, -99] as [number, number],
    ),
  );
}

function gpxFile(content: string, name = "rodada.gpx"): File {
  // El tipo llega vacío en la vida real: `.gpx` no está registrado en la mayoría de los sistemas.
  return new File([content], name, { type: "" });
}

function fileInput(): HTMLInputElement {
  return screen.getByTestId("route-file") as HTMLInputElement;
}

function hiddenRouteValue(): string {
  return (document.querySelector('input[name="route"]') as HTMLInputElement)
    .value;
}

/**
 * Espera a que el archivo esté leído antes de mirar el campo oculto.
 *
 * Leerlo es asíncrono, así que `userEvent.upload` vuelve **antes** de que el campo tenga nada: sin
 * esta espera, la prueba lee la cadena vacía y falla por una carrera en vez de por el componente.
 * El resumen es lo que aparece justo después de rellenarlo, así que sirve de señal.
 */
async function routeIsRead(): Promise<void> {
  await screen.findByTestId("route-summary");
}

describe("RouteFileField", () => {
  it("empieza vacío, porque el recorrido es opcional", () => {
    renderWithIntl(<RouteFileField />);

    expect(hiddenRouteValue()).toBe("");
  });

  /* La razón de ser del componente: al formulario le llegan los puntos, no el archivo. Es lo que
     saca el GPX del cuerpo de la Server Action, donde reventaba con «Body exceeded 1 MB». */
  it("deja en el formulario los puntos del recorrido, no el archivo", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(
      fileInput(),
      gpxFile(
        gpxWith([
          [19.432608, -99.133209],
          [19.434, -99.135],
        ]),
      ),
    );
    await routeIsRead();

    const payload = JSON.parse(hiddenRouteValue());

    expect(payload.points).toEqual([
      { latitude: 19.432608, longitude: -99.133209 },
      { latitude: 19.434, longitude: -99.135 },
    ]);
    expect(payload.meters).toBeGreaterThan(0);
    expect(payload.originalPoints).toBe(2);
  });

  /**
   * El fallo de producción, escrito como prueba.
   *
   * Un GPX de 10.000 puntos son cientos de KB de XML; lo que sale hacia el servidor son los 2.000
   * que `parseGpx` conserva. Sin esto, nada impide que alguien vuelva a mandar el archivo entero.
   */
  it("un archivo enorme produce un cuerpo chico", async () => {
    renderWithIntl(<RouteFileField />);

    const content = longRoute(10_000);
    await userEvent.upload(fileInput(), gpxFile(content));
    await routeIsRead();

    const payload = JSON.parse(hiddenRouteValue());

    expect(payload.points).toHaveLength(MAX_REDUCED_ROUTE_POINTS);
    expect(payload.originalPoints).toBe(10_000);
    expect(hiddenRouteValue().length).toBeLessThan(content.length / 2);
  });

  /* Los metros se miden sobre TODOS los puntos del archivo, antes de reducir: es la distancia que
     la persona recorrió, no la del dibujo. Es el dato que el servidor ya no puede recalcular. */
  it("mide la distancia sobre el archivo completo, no sobre los puntos que conserva", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(fileInput(), gpxFile(longRoute(10_000)));
    await routeIsRead();

    const { points, meters } = JSON.parse(hiddenRouteValue());

    expect(points).toHaveLength(MAX_REDUCED_ROUTE_POINTS);
    // 10.000 tramos de ~1,1 m: ~11 km. Medida sobre los 2.000 conservados daría bastante menos.
    expect(meters).toBeGreaterThan(10_000);
  });

  it("resume lo que se subió, con sus kilómetros y sus puntos", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(fileInput(), gpxFile(longRoute(10_000), "ruta.gpx"));

    const summary = await screen.findByTestId("route-summary");

    expect(summary).toHaveTextContent("ruta.gpx");
    expect(summary).toHaveTextContent(/10[.,]?000 puntos/);
  });

  /* El regalo de leerlo aquí: el error sale al elegir el archivo, no tras enviar el formulario. */
  it("rechaza al momento un archivo que no es GPX, sin ensuciar el campo", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(
      fileInput(),
      gpxFile("esto es una lista de la compra", "notas.gpx"),
    );

    expect(await screen.findByText(/no es un GPX/i)).toBeInTheDocument();
    expect(hiddenRouteValue()).toBe("");
  });

  it("rechaza un GPX sin recorrido dentro", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(fileInput(), gpxFile(gpxWith([[19, -99]])));

    expect(await screen.findByText(/al menos dos puntos/i)).toBeInTheDocument();
    expect(hiddenRouteValue()).toBe("");
  });

  /* Se mira el tamaño ANTES de leerlo: leerlo es reservarlo en el teléfono de quien publica. */
  it("no intenta leer un archivo que se pasa de tamaño", async () => {
    renderWithIntl(<RouteFileField />);

    const enorme = gpxFile("x");
    Object.defineProperty(enorme, "size", {
      value: MAX_ROUTE_FILE_BYTES + 1,
    });

    await userEvent.upload(fileInput(), enorme);

    expect(screen.getByText(/pesa demasiado/i)).toBeInTheDocument();
    expect(hiddenRouteValue()).toBe("");
  });

  it("se puede quitar el recorrido ya leído", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(
      fileInput(),
      gpxFile(
        gpxWith([
          [19, -99],
          [19.1, -99.1],
        ]),
      ),
    );
    await routeIsRead();
    await userEvent.click(screen.getByTestId("route-remove"));

    expect(hiddenRouteValue()).toBe("");
    expect(screen.queryByTestId("route-summary")).not.toBeInTheDocument();
  });

  it("solo ofrece elegir archivos .gpx", () => {
    renderWithIntl(<RouteFileField />);

    expect(fileInput()).toHaveAttribute("accept", ".gpx");
  });

  it("enseña lo que contestó la acción cuando el navegador no tiene nada que decir", () => {
    renderWithIntl(<RouteFileField error="Ese archivo no sirve." />);

    expect(screen.getByText("Ese archivo no sirve.")).toBeInTheDocument();
  });
});

/**
 * La ruta que la publicación ya tiene.
 *
 * Es la mitad que sólo existe al editar, y la que abrió el hueco de este slice: `/editar/[slug]`
 * ni siquiera montaba el campo, así que un evento publicado no podía cambiar ni quitar su
 * recorrido — la única salida era borrar la publicación y rehacerla.
 *
 * Lo que se afirma aquí es el **significado de cada gesto**, porque el campo oculto habla con tres
 * palabras y no con dos: vacío es «déjala como está», el JSON es «reemplázala» y la marca es
 * «quítala». Confundir la primera con la tercera hace que un evento pierda su trazo cada vez que
 * alguien corrige una falta en el título.
 */
describe("RouteFileField — la ruta que ya estaba", () => {
  const EXISTING = { lengthMeters: 8200, sourcePoints: 1500 };

  it("la enseña con su forma: no hay nombre de archivo que enseñar", () => {
    /* El `.gpx` no se guarda en ningún sitio —se lee, se extraen sus puntos y se tira—, así que
       meses después lo único que se sabe del recorrido es cuánto mide y con cuántos puntos. */
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    expect(screen.getByTestId("route-existing")).toHaveTextContent(/8\.2 km/);
    expect(screen.getByTestId("route-existing")).toHaveTextContent(/1500/);
  });

  it("no la toca mientras nadie diga nada: el campo va vacío", () => {
    // El caso normal. Casi toda edición es una falta de ortografía en el título.
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    expect(hiddenRouteValue()).toBe("");
  });

  it("al publicar no hay ninguna, y no se inventa", () => {
    renderWithIntl(<RouteFileField />);

    expect(screen.queryByTestId("route-existing")).not.toBeInTheDocument();
  });

  it("quitarla lo dice con una palabra propia, no con el vacío", async () => {
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    await userEvent.click(screen.getByTestId("route-remove-existing"));

    expect(hiddenRouteValue()).toBe("removed");
    expect(screen.getByTestId("route-removed")).toBeInTheDocument();
    expect(screen.queryByTestId("route-existing")).not.toBeInTheDocument();
  });

  /* Quitar algo sin vuelta atrás es una trampa, y aquí la vuelta es gratis: nada se ha guardado. */
  it("y se puede deshacer antes de guardar", async () => {
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    await userEvent.click(screen.getByTestId("route-remove-existing"));
    await userEvent.click(screen.getByTestId("route-undo-removal"));

    expect(hiddenRouteValue()).toBe("");
    expect(screen.getByTestId("route-existing")).toBeInTheDocument();
  });

  it("subir otro archivo la reemplaza: deja de enseñarse la vieja", async () => {
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    await userEvent.upload(fileInput(), gpxFile(longRoute(50)));
    await routeIsRead();

    expect(screen.queryByTestId("route-existing")).not.toBeInTheDocument();
    expect(hiddenRouteValue()).toContain('"points"');
  });

  /*
   * Arrepentirse del reemplazo NO es quedarse sin recorrido. Sin esta vuelta, quien elige el archivo
   * equivocado y lo quita se queda sin la ruta que tenía — y sin enterarse hasta abrir la ficha.
   */
  it("y arrepentirse del reemplazo devuelve la que ya estaba", async () => {
    renderWithIntl(<RouteFileField existingRoute={EXISTING} />);

    await userEvent.upload(fileInput(), gpxFile(longRoute(50)));
    await routeIsRead();
    await userEvent.click(screen.getByTestId("route-remove"));

    expect(hiddenRouteValue()).toBe("");
    expect(screen.getByTestId("route-existing")).toBeInTheDocument();
  });

  /* Al publicar, quitar el archivo elegido sí deja el campo vacío y sin nada que enseñar. */
  it("al publicar, quitar el archivo no resucita ninguna ruta", async () => {
    renderWithIntl(<RouteFileField />);

    await userEvent.upload(fileInput(), gpxFile(longRoute(50)));
    await routeIsRead();
    await userEvent.click(screen.getByTestId("route-remove"));

    expect(hiddenRouteValue()).toBe("");
    expect(screen.queryByTestId("route-existing")).not.toBeInTheDocument();
  });
});

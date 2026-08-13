import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_UPLOAD_EDGE,
  planResize,
  shrinkImageForUpload,
} from "./shrinkImage";

function imageFile(name: string, type = "image/jpeg", bytes = 5_000_000): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("planResize", () => {
  /*
   * La corrida de escritorio del tope. Lo que importa de cada fila es que el lado LARGO acaba
   * valiendo 2048 y que la proporcion no se mueve, venga la foto tumbada o de pie.
   */
  it.each([
    { w: 4000, h: 3000, expected: { width: 2048, height: 1536 } },
    { w: 3000, h: 4000, expected: { width: 1536, height: 2048 } },
    { w: 4000, h: 4000, expected: { width: 2048, height: 2048 } },
    { w: 6000, h: 2000, expected: { width: 2048, height: 683 } },
  ])("encoge $w×$h al tope por su lado largo", ({ w, h, expected }) => {
    expect(planResize(w, h)).toEqual(expected);
  });

  /* Nunca se agranda: estirar una foto pequeña no le añade informacion, solo peso. */
  it.each([
    [800, 600],
    [MAX_UPLOAD_EDGE, 1000],
    [1000, MAX_UPLOAD_EDGE],
  ])("deja en paz %i×%i, que ya cabe", (w, h) => {
    expect(planResize(w, h)).toBeNull();
  });

  it("acepta otro tope, para quien tenga otras necesidades", () => {
    expect(planResize(1000, 500, 500)).toEqual({ width: 500, height: 250 });
  });
});

describe("shrinkImageForUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /* Un video no cabe aqui: recodificarlo en el navegador exige un codec que no se puede pagar. */
  it("no toca lo que no es una imagen", async () => {
    const video = imageFile("receta.mp4", "video/mp4");

    expect((await shrinkImageForUpload(video)).file).toBe(video);
  });

  /* Un GIF pierde la animacion al pasar por un canvas, que solo sabe del primer fotograma; un SVG
     es texto y redibujarlo lo convierte en pixeles, o sea lo empeora en todo. */
  it.each(["image/gif", "image/svg+xml"])("no toca un %s", async (type) => {
    const file = imageFile("logo", type);

    expect((await shrinkImageForUpload(file)).file).toBe(file);
  });

  /*
   * La red de seguridad, y la razon por la que esta prueba importa mas que las otras: publicar no
   * puede fallar porque un ahorro no salga. En jsdom no hay `createImageBitmap`, que es exactamente
   * la forma de un navegador que no sabe hacer esto.
   */
  it("devuelve el original cuando el navegador no sabe decodificar", async () => {
    const foto = imageFile("jugo-verde.jpg");

    const result = await shrinkImageForUpload(foto);

    expect(result.file).toBe(foto);
    expect(result.width).toBeUndefined();
  });

  it("devuelve el original si decodificar revienta", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("formato corrupto")),
    );
    const foto = imageFile("rota.jpg");

    expect((await shrinkImageForUpload(foto)).file).toBe(foto);
  });

  /**
   * El camino feliz, con el navegador fingido.
   *
   * `createImageBitmap` y `canvas.toBlob` no existen en jsdom, asi que se ponen a mano: lo que se
   * comprueba no es que el canvas dibuje —eso es del navegador— sino las decisiones nuestras, que
   * son el tamano de destino, el tipo, el nombre y las medidas que se devuelven.
   */
  function stubBrowser(width: number, height: number, blobSize: number) {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width, height, close: vi.fn() }),
    );

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      toBlob: (callback: (blob: Blob) => void, type: string) =>
        callback(new File([new Uint8Array(blobSize)], "x", { type })),
    };

    vi.spyOn(document, "createElement").mockReturnValue(
      canvas as unknown as HTMLElement,
    );

    return canvas;
  }

  it("sube el archivo encogido, en WebP y con el nombre acorde", async () => {
    stubBrowser(4000, 3000, 400_000);

    const result = await shrinkImageForUpload(imageFile("IMG_0001.jpg"));

    expect(result.file.type).toBe("image/webp");
    expect(result.file.name).toBe("IMG_0001.webp");
    expect(result.file.size).toBe(400_000);
    expect({ width: result.width, height: result.height }).toEqual({
      width: 2048,
      height: 1536,
    });

    vi.restoreAllMocks();
  });

  /* Las medidas que salen son las del archivo que se SUBE. Guardar las del original haria que la
     ficha reservara un hueco con el tamano equivocado. */
  it("devuelve las medidas del original cuando no hizo falta encogerlo", async () => {
    stubBrowser(800, 600, 10_000);

    const result = await shrinkImageForUpload(imageFile("pequena.jpg"));

    expect({ width: result.width, height: result.height }).toEqual({
      width: 800,
      height: 600,
    });

    vi.restoreAllMocks();
  });

  /* Recodificar una imagen ya optimizada la deja mas grande. Subir eso seria trabajar para empeorar. */
  it("se queda el original si el resultado pesa mas", async () => {
    stubBrowser(1000, 800, 900_000);
    const yaOptimizada = imageFile("optimizada.jpg", "image/jpeg", 500_000);

    const result = await shrinkImageForUpload(yaOptimizada);

    expect(result.file).toBe(yaOptimizada);
    expect(result.width).toBe(1000);

    vi.restoreAllMocks();
  });
});

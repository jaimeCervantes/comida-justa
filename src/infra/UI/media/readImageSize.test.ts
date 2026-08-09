import { afterEach, describe, expect, it, vi } from "vitest";
import { readImageSize } from "./readImageSize";

const imageFile = (type = "image/jpeg") =>
  new File([new Uint8Array([1, 2, 3])], "foto.jpg", { type });

function givenBitmap(
  implementation: (file: Blob) => Promise<{ width: number; height: number }>,
) {
  const close = vi.fn();
  const create = vi.fn(async (file: Blob) => ({
    ...(await implementation(file)),
    close,
  }));

  vi.stubGlobal("createImageBitmap", create);

  return { create, close };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readImageSize", () => {
  it("devuelve el tamaño real del archivo", async () => {
    givenBitmap(async () => ({ width: 1200, height: 1600 }));

    await expect(readImageSize(imageFile())).resolves.toEqual({
      width: 1200,
      height: 1600,
    });
  });

  /* Una copia decodificada de una foto de 12 Mpx ocupa decenas de MB; sin cerrarla, publicar
     varias en una sesión las va acumulando. */
  it("cierra el bitmap que decodifica", async () => {
    const { close } = givenBitmap(async () => ({ width: 800, height: 600 }));

    await readImageSize(imageFile());

    expect(close).toHaveBeenCalled();
  });

  /* Un vídeo se mediría con `<video>` y `loadedmetadata`, pero hoy se pinta con `aspect-video`
     fijo: guardar unas dimensiones que nadie lee sería código muerto. */
  it("no mide un vídeo, y no lo intenta siquiera", async () => {
    const { create } = givenBitmap(async () => ({ width: 1, height: 1 }));

    await expect(readImageSize(imageFile("video/mp4"))).resolves.toEqual({});
    expect(create).not.toHaveBeenCalled();
  });

  /* «No lo sabemos» es un valor legítimo en la base. Lo que no puede pasar es que una medición
     fallida impida publicar. */
  it("no lanza cuando el navegador no puede decodificarlo", async () => {
    givenBitmap(() => Promise.reject(new Error("decode failed")));
    // El respaldo tampoco resuelve en jsdom: `Image` no dispara `onload` sin decodificador real.
    vi.stubGlobal(
      "Image",
      class {
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:x",
      revokeObjectURL: vi.fn(),
    });

    await expect(readImageSize(imageFile())).resolves.toEqual({});
  });

  it("descarta un tamaño de cero, que no es una medida", async () => {
    givenBitmap(async () => ({ width: 0, height: 0 }));
    vi.stubGlobal(
      "Image",
      class {
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:x",
      revokeObjectURL: vi.fn(),
    });

    await expect(readImageSize(imageFile())).resolves.toEqual({});
  });
});

import { describe, expect, it } from "vitest";
import { buildSharePreview, type ShareMediaItem } from "./shareMedia";

const LOGO = "/logo.webp";

const FOTO = {
  type: "image",
  url: "https://firebasestorage.googleapis.com/jugo-verde.jpg",
  alt: "Jugo Verde",
} satisfies ShareMediaItem;

const VIDEO = {
  type: "video",
  url: "https://firebasestorage.googleapis.com/dormir-profundo.mp4",
  alt: "La clave para dormir profundo",
} satisfies ShareMediaItem;

describe("buildSharePreview", () => {
  // Corrida de escritorio del escenario: qué se anuncia según lo que trae la publicación.
  it.each([
    ["una foto (Jugo Verde)", [FOTO], FOTO.url, undefined, true],
    [
      "un video (La clave para dormir profundo)",
      [VIDEO],
      LOGO,
      VIDEO.url,
      false,
    ],
    ["video y foto", [VIDEO, FOTO], FOTO.url, VIDEO.url, true],
    ["nada", [], LOGO, undefined, false],
  ])(
    "con %s anuncia la imagen correcta",
    (_caso, media, imageUrl, videoUrl, hasOwnImage) => {
      expect(buildSharePreview(media, LOGO)).toMatchObject({
        imageUrl,
        videoUrl,
        hasOwnImage,
      });
    },
  );

  it("nunca manda un video como imagen", () => {
    const preview = buildSharePreview([VIDEO], LOGO);

    expect(preview.imageUrl).not.toContain(".mp4");
  });

  it("degrada cuando la publicación no tiene media", () => {
    expect(buildSharePreview(undefined, LOGO)).toEqual({
      imageUrl: LOGO,
      imageAlt: undefined,
      videoUrl: undefined,
      hasOwnImage: false,
    });
  });

  it("ignora los medios sin URL, que existen en publicaciones migradas", () => {
    const preview = buildSharePreview([{ type: "image", url: "" }, FOTO], LOGO);

    expect(preview.imageUrl).toBe(FOTO.url);
  });

  it("no toma un audio como imagen ni como video", () => {
    const preview = buildSharePreview(
      [{ type: "audio", url: "https://firebasestorage.googleapis.com/a.mp3" }],
      LOGO,
    );

    expect(preview).toMatchObject({
      imageUrl: LOGO,
      videoUrl: undefined,
      hasOwnImage: false,
    });
  });

  it("lleva el texto alternativo de la imagen, que es el título de la publicación", () => {
    expect(buildSharePreview([FOTO], LOGO).imageAlt).toBe("Jugo Verde");
  });
});

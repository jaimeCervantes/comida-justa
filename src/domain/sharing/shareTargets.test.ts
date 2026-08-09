import { describe, expect, it } from "vitest";
import {
  SHARE_NETWORKS,
  type ShareNetwork,
  shareTargetLink,
} from "./shareTargets";

const STORE = {
  url: "https://hazlosano.com/tienda/hazlo-sano",
  text: "Mira mi tienda: Hazlo Sano",
};

describe("shareTargetLink", () => {
  // La corrida de escritorio del escenario "Cada red recibe la dirección en el parámetro que ella
  // entiende". Cada fila documenta qué acepta esa red, que es lo que decide la forma de la URL.
  it.each<[ShareNetwork, string]>([
    [
      "whatsapp",
      "https://wa.me/?text=Mira%20mi%20tienda%3A%20Hazlo%20Sano%20https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano",
    ],
    [
      "facebook",
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano",
    ],
    [
      "x",
      "https://x.com/intent/post?url=https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano&text=Mira%20mi%20tienda%3A%20Hazlo%20Sano",
    ],
    [
      "telegram",
      "https://t.me/share/url?url=https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano&text=Mira%20mi%20tienda%3A%20Hazlo%20Sano",
    ],
    [
      "email",
      "mailto:?subject=Mira%20mi%20tienda%3A%20Hazlo%20Sano&body=Mira%20mi%20tienda%3A%20Hazlo%20Sano%0Ahttps%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano",
    ],
  ])("%s recibe la dirección donde la espera", (network, expected) => {
    expect(shareTargetLink(network, STORE)).toBe(expected);
  });

  /* Facebook descarta desde 2017 cualquier `quote`/`description` y compone la publicación con las
     etiquetas Open Graph del destino. Mandarle el texto sería código muerto que aparenta funcionar,
     así que esta prueba fija que NO se le manda. */
  it("no le manda texto a Facebook, porque lo ignora", () => {
    const link = shareTargetLink("facebook", STORE);

    expect(link).not.toContain("text");
    expect(link).not.toContain("quote");
  });

  // Un handle no puede traer estos caracteres, pero el texto sí: el nombre de una tienda es libre.
  it.each([
    ["Café & Té", "Caf%C3%A9%20%26%20T%C3%A9"],
    ["Pan #1", "Pan%20%231"],
    ["100% integral", "100%25%20integral"],
    ["Jugo Verde a $40", "Jugo%20Verde%20a%20%2440"],
  ])("codifica %j, que si no rompería la URL", (text, encoded) => {
    expect(shareTargetLink("whatsapp", { ...STORE, text })).toContain(
      `?text=${encoded}%20`,
    );
  });

  it("arma un enlace válido para cada red declarada", () => {
    for (const network of SHARE_NETWORKS) {
      const link = shareTargetLink(network, STORE);

      expect(link).toMatch(/^(https:\/\/|mailto:)/);
      expect(link).toContain(encodeURIComponent(STORE.url));
    }
  });
});

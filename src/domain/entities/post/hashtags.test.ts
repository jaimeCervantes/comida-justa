import { describe, expect, it } from "vitest";
import { splitHashtags, withoutHashtags } from "./hashtags";

/** El cierre real de "Alimentos que Mejoran tu Rendimiento Mental". */
const conEtiquetas =
  "Incluye estos alimentos en tu dieta diaria.\n#NutriciónCerebral #Saludable #Superfoods";

describe("splitHashtags", () => {
  it("separa la ristra final del texto", () => {
    expect(splitHashtags(conEtiquetas)).toEqual({
      body: "Incluye estos alimentos en tu dieta diaria.",
      hashtags: ["NutriciónCerebral", "Saludable", "Superfoods"],
    });
  });

  it("deja intacto el texto que no termina en etiquetas", () => {
    const texto = "Salud justa en todos los sentidos. Comunidad y justicia.";

    expect(splitHashtags(texto)).toEqual({ body: texto, hashtags: [] });
  });

  // Lo que un filtro ingenuo rompería.
  it.each([
    ["Calle Melchor Ocampo #2, Tezonapa"],
    ["El #1 en ventas de la semana"],
    ["Pan de masa madre # 3 días de fermentación"],
  ])("no toca el # que va en medio de la frase: %j", (texto) => {
    expect(withoutHashtags(texto)).toBe(texto);
  });

  it("aguanta el texto vacío y el ausente", () => {
    expect(withoutHashtags("")).toBe("");
    expect(withoutHashtags(null)).toBe("");
    expect(withoutHashtags(undefined)).toBe("");
  });

  it("recorta también los saltos de línea que quedaban antes de las etiquetas", () => {
    expect(withoutHashtags("Duerme mejor.\n\n#Sueño #Descanso")).toBe(
      "Duerme mejor.",
    );
  });

  it("no deja nada cuando la publicación era solo etiquetas", () => {
    expect(splitHashtags("#Salud #Comunidad")).toEqual({
      body: "",
      hashtags: ["Salud", "Comunidad"],
    });
  });
});

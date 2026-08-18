import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { publicationPillarEmptyMessage } from "./publicationPillarEmptyMessage";

describe("publicationPillarEmptyMessage", () => {
  it("usa el mensaje normal cuando no hay filtro de pilar", () => {
    expect(
      publicationPillarEmptyMessage({
        currentPillar: null,
        fallback: "No hay publicaciones.",
        t: (key, values) =>
          key === "empty" ? `Sin publicaciones de ${values?.pillar}` : key,
      }),
    ).toBe("No hay publicaciones.");
  });

  it("nombra el pilar filtrado cuando la lista queda vacia", () => {
    expect(
      publicationPillarEmptyMessage({
        currentPillar: "mindSpirit",
        fallback: "No hay publicaciones.",
        t: (key, values) => {
          if (key === "empty") return `Sin publicaciones de ${values?.pillar}`;
          return es.publicationPillars[key];
        },
      }),
    ).toBe(`Sin publicaciones de ${es.publicationPillars.mindSpirit}`);
  });
});

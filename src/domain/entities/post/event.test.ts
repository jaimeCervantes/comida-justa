import { describe, expect, it } from "vitest";
import { eventStateAt, hasPassed, isEvent, isUpcoming } from "./event";

/** La rodada del sábado, que es el caso que motivó la feature. */
const RODADA = {
  kind: "evento",
  startsAt: "2026-08-22T06:00:00Z",
  endsAt: null,
};

const RODADA_CON_FIN = {
  ...RODADA,
  endsAt: "2026-08-22T08:00:00Z",
};

describe("isEvent", () => {
  it("solo un evento ocurre en un momento", () => {
    expect(isEvent({ kind: "evento" })).toBe(true);
    expect(isEvent({ kind: "producto" })).toBe(false);
    expect(isEvent({ kind: "anuncio" })).toBe(false);
    expect(isEvent({})).toBe(false);
  });
});

describe("eventStateAt", () => {
  /* La corrida de escritorio del `.feature`. Son TRES estados y no dos porque una rodada de 6:00 a
     8:00 no está "pasada" a las 7:00 — está ocurriendo, que es justo cuando alguien mira el móvil
     para ver si todavía llega. */
  it.each([
    ["2026-08-21T20:00:00Z", RODADA, "proximo"],
    ["2026-08-22T05:59:00Z", RODADA, "proximo"],
    ["2026-08-22T06:01:00Z", RODADA, "pasado"],
    ["2026-08-22T07:00:00Z", RODADA_CON_FIN, "en_curso"],
    ["2026-08-22T08:01:00Z", RODADA_CON_FIN, "pasado"],
    ["2026-08-22T06:00:00Z", RODADA_CON_FIN, "en_curso"],
  ] as const)("a las %s está %#: %s", (ahora, post, esperado) => {
    expect(eventStateAt(post, new Date(ahora))).toBe(esperado);
  });

  /* Sin `ends_at` caduca en su hora de inicio. Se prefirió eso a inventarle una duración por
     omisión, que sería adivinar cuánto dura una cosa que no sabemos qué es. */
  it("sin hora de fin, justo a la hora de inicio todavía está en curso", () => {
    expect(eventStateAt(RODADA, new Date("2026-08-22T06:00:00Z"))).toBe(
      "en_curso",
    );
  });

  describe("cuando no hay evento del que hablar", () => {
    /* `null` es distinto de "ya pasó": un producto no pasa, no tiene estado. */
    it("un producto con fecha no tiene estado", () => {
      expect(
        eventStateAt(
          { kind: "producto", startsAt: "2026-08-22T06:00:00Z" },
          new Date("2026-08-23T00:00:00Z"),
        ),
      ).toBeNull();
    });

    it("un evento sin fecha tampoco", () => {
      expect(eventStateAt({ kind: "evento", startsAt: null })).toBeNull();
    });

    it("una fecha ilegible se trata como ausente, no revienta", () => {
      expect(
        eventStateAt({ kind: "evento", startsAt: "el sábado por la mañana" }),
      ).toBeNull();
    });
  });

  it("acepta la fecha como Date y como texto, que es como llega de la base", () => {
    const ahora = new Date("2026-08-21T20:00:00Z");

    expect(
      eventStateAt(
        { kind: "evento", startsAt: new Date(RODADA.startsAt) },
        ahora,
      ),
    ).toBe("proximo");
    expect(eventStateAt(RODADA, ahora)).toBe("proximo");
  });
});

describe("isUpcoming", () => {
  /* Lo que se anuncia como algo a lo que todavía se puede ir: lo que aún no empieza y lo que está
     ocurriendo ahora mismo. */
  it("lo próximo y lo que está pasando ahora", () => {
    expect(isUpcoming(RODADA, new Date("2026-08-21T20:00:00Z"))).toBe(true);
    expect(isUpcoming(RODADA_CON_FIN, new Date("2026-08-22T07:00:00Z"))).toBe(
      true,
    );
  });

  it("lo que ya terminó, no", () => {
    expect(isUpcoming(RODADA_CON_FIN, new Date("2026-08-22T08:01:00Z"))).toBe(
      false,
    );
  });

  /* Un producto no se anuncia como próximo, pero tampoco "pasa": las dos preguntas son falsas. */
  it("lo que no es un evento nunca es próximo", () => {
    const producto = { kind: "producto" };

    expect(isUpcoming(producto)).toBe(false);
    expect(hasPassed(producto)).toBe(false);
  });
});

describe("hasPassed", () => {
  it("el domingo, la rodada del sábado ya pasó", () => {
    expect(hasPassed(RODADA, new Date("2026-08-23T09:00:00Z"))).toBe(true);
  });

  /* Y esto es lo que hace que nadie tenga que apagar nada: el estado sale del reloj. */
  it("el viernes todavía no", () => {
    expect(hasPassed(RODADA, new Date("2026-08-21T09:00:00Z"))).toBe(false);
  });
});

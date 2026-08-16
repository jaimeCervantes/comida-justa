import { describe, expect, it } from "vitest";
import {
  applyModerationDecision,
  canBeViewedBy,
  chatbotVisibilityFor,
  DEFAULT_MODERATION_STATUS,
  isPubliclyVisible,
  resolveModerationReason,
  resolveModerationStatus,
} from "./moderation";

const OWNER = "user-dona-keto";

describe("resolveModerationStatus", () => {
  it.each(["published", "in_review", "rejected"] as const)(
    'conserva el estado conocido "%s"',
    (status) => {
      expect(resolveModerationStatus(status)).toBe(status);
    },
  );

  /* Una consulta que no pidió la columna no puede hacer desaparecer una publicación: mismo
     criterio que `isAvailable`, donde la ausencia significa disponible. */
  it.each([null, undefined, "", "pendiente_de_algo"])(
    "trata %s como publicada",
    (value) => {
      expect(resolveModerationStatus(value)).toBe(DEFAULT_MODERATION_STATUS);
      expect(DEFAULT_MODERATION_STATUS).toBe("published");
    },
  );
});

describe("resolveModerationReason", () => {
  it("conserva un motivo de la lista", () => {
    expect(resolveModerationReason("health_claim")).toBe("health_claim");
  });

  it.each([null, undefined, "", "politico", "Contiene afirmaciones falsas"])(
    "descarta %s",
    (value) => {
      expect(resolveModerationReason(value)).toBeNull();
    },
  );
});

describe("isPubliclyVisible", () => {
  it("solo deja pasar lo publicado", () => {
    expect(isPubliclyVisible({ moderationStatus: "published" })).toBe(true);
    expect(isPubliclyVisible({ moderationStatus: "in_review" })).toBe(false);
    expect(isPubliclyVisible({ moderationStatus: "rejected" })).toBe(false);
  });
});

describe("canBeViewedBy", () => {
  const rejected = {
    userId: OWNER,
    moderationStatus: "rejected",
    moderationReason: "off_topic",
  };

  it("lo publicado lo ve cualquiera, incluso sin sesión", () => {
    const published = { userId: OWNER, moderationStatus: "published" };

    expect(canBeViewedBy(published, null)).toBe(true);
    expect(canBeViewedBy(published, { id: "otra-persona" })).toBe(true);
  });

  /* El único camino por el que alguien se entera de que le bajaron algo: no hay correo ni
     notificaciones en el sitio. */
  it("lo bajado lo sigue viendo su autor", () => {
    expect(canBeViewedBy(rejected, { id: OWNER })).toBe(true);
  });

  it("lo bajado lo ve el admin", () => {
    expect(canBeViewedBy(rejected, { id: "admin", isAdmin: true })).toBe(true);
  });

  it("lo bajado no lo ve nadie más", () => {
    expect(canBeViewedBy(rejected, { id: "otra-persona" })).toBe(false);
    expect(canBeViewedBy(rejected, null)).toBe(false);
    expect(canBeViewedBy(rejected, undefined)).toBe(false);
  });

  /* Sin esto, un visitante anónimo cuyo `id` llega vacío pasaría por dueño de una publicación
     cuyo `user_id` también viniera vacío. */
  it("una sesión sin id no hereda la publicación", () => {
    expect(canBeViewedBy({ ...rejected, userId: "" }, { id: "" })).toBe(false);
    expect(canBeViewedBy({ ...rejected, userId: "" }, { id: null })).toBe(
      false,
    );
  });
});

describe("applyModerationDecision", () => {
  it("rechazar guarda el motivo", () => {
    expect(
      applyModerationDecision({ action: "reject", reason: "off_topic" }),
    ).toEqual({ status: "rejected", reason: "off_topic" });
  });

  /* El motivo es justamente lo que se pinta en el aviso: dejarlo puesto haría que una publicación
     restituida siguiera explicando por qué se bajó. */
  it("aprobar borra el motivo", () => {
    expect(applyModerationDecision({ action: "approve" })).toEqual({
      status: "published",
      reason: null,
    });
  });
});

describe("chatbotVisibilityFor", () => {
  /* El bot consulta `kind = 'producto' AND is_available`, así que el interruptor que ya respeta es
     `is_available`, no el estado de moderación, que no conoce. */
  it("un producto bajado se silencia también para el bot", () => {
    expect(
      chatbotVisibilityFor({ kind: "producto", moderationStatus: "rejected" }),
    ).toBe("silence");
    expect(
      chatbotVisibilityFor({ kind: "producto", moderationStatus: "in_review" }),
    ).toBe("silence");
  });

  it("un producto restituido se vuelve a ofrecer", () => {
    expect(
      chatbotVisibilityFor({ kind: "producto", moderationStatus: "published" }),
    ).toBe("restore");
  });

  /* Ni silenciar ni restituir: `is_available` en un anuncio no significa nada, así que escribirlo
     sería ensuciar la columna con un dato sin sentido. */
  it.each(["rejected", "in_review", "published"])(
    "en un anuncio %s no se toca nada",
    (status) => {
      expect(
        chatbotVisibilityFor({ kind: "anuncio", moderationStatus: status }),
      ).toBe("leave");
    },
  );
});

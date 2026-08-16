import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModeratedPost } from "~/use_cases/moderatePost/ports/IModerationRepository";
import ModerationQueue, { type QueueLabels } from "./ModerationQueue";

/* La acción es `"use server"`: importarla de verdad arrastraría `auth`, la conexión y `pg` a un
   entorno de jsdom. Lo que se prueba aquí es la pantalla, no la escritura. */
vi.mock("../actions", () => ({ decideModeration: vi.fn() }));

const LABELS: QueueLabels = {
  empty: "No hay nada esperando revisión.",
  columnPost: "Publicación",
  columnAuthor: "Quién la publicó",
  columnStatus: "Estado",
  columnReason: "Motivo",
  columnDate: "Desde",
  approve: "Publicar",
  reject: "Bajar",
  reasonPlaceholder: "— Elige un motivo —",
  statusInReview: "En revisión",
  statusRejected: "Retirada",
  statusPublished: "Publicada",
  reportCount: (count: number) => `${count} reportes`,
  reasons: {
    off_topic:
      "No trata de descanso, alimentación, movimiento ni mente y espíritu.",
    health_claim: "Promete resultados de salud que no se pueden sostener.",
    spam: "Parece publicidad engañosa o una oferta de ganancia fácil.",
    offensive: "Tiene contenido ofensivo.",
    restricted_product: "Ofrece algo que no se puede vender aquí.",
  },
};

const tsuru: ModeratedPost = {
  id: "post-tsuru",
  slug: "vendo-nissan-tsuru-2015",
  title: "Vendo Nissan Tsuru 2015",
  kind: "producto",
  status: "rejected",
  reason: "off_topic",
  authorId: "user-jaime",
  authorName: "Jaime",
  createdAt: new Date("2026-08-14T09:00:00Z"),
  reviewedAt: new Date("2026-08-16T11:00:00Z"),
  reportCount: 0,
};

const sinRevisar: ModeratedPost = {
  ...tsuru,
  id: "post-dona",
  slug: "dona-chocolate-keto",
  title: "Dona Chocolate Keto",
  status: "in_review",
  reason: null,
  reviewedAt: null,
};

const denunciada: ModeratedPost = {
  ...tsuru,
  id: "post-denunciada",
  slug: "jugo-verde",
  title: "Jugo Verde",
  status: "published",
  reason: null,
  reportCount: 3,
};

describe("ModerationQueue", () => {
  it("con la bandeja vacía dice que no hay nada, en vez de una tabla hueca", () => {
    render(<ModerationQueue posts={[]} labels={LABELS} />);

    expect(screen.getByTestId("moderation-empty")).toHaveTextContent(
      LABELS.empty,
    );
    expect(screen.queryByTestId("moderation-queue")).not.toBeInTheDocument();
  });

  it("enseña el título, quién la publicó y su estado", () => {
    render(<ModerationQueue posts={[tsuru]} labels={LABELS} />);

    const row = screen.getByTestId(`moderation-row-${tsuru.id}`);

    expect(within(row).getByText("Vendo Nissan Tsuru 2015")).toBeVisible();
    expect(within(row).getByText("Jaime")).toBeVisible();
    expect(
      screen.getByTestId(`moderation-status-${tsuru.id}`),
    ).toHaveTextContent(LABELS.statusRejected);
  });

  /* El motivo se pinta con el texto del catálogo, no con el código de la columna: `off_topic` no
     le dice nada a nadie. */
  it("traduce el motivo guardado", () => {
    render(<ModerationQueue posts={[tsuru]} labels={LABELS} />);

    expect(
      screen.getByTestId(`moderation-reason-label-${tsuru.id}`),
    ).toHaveTextContent(LABELS.reasons.off_topic);
  });

  it("sin motivo guardado no inventa ninguno", () => {
    render(<ModerationQueue posts={[sinRevisar]} labels={LABELS} />);

    expect(
      screen.getByTestId(`moderation-reason-label-${sinRevisar.id}`),
    ).toHaveTextContent("—");
  });

  it("distingue lo que espera revisión de lo que ya se bajó", () => {
    render(<ModerationQueue posts={[sinRevisar]} labels={LABELS} />);

    expect(
      screen.getByTestId(`moderation-status-${sinRevisar.id}`),
    ).toHaveTextContent(LABELS.statusInReview);
  });

  it("ofrece publicar y bajar en cada fila", () => {
    render(<ModerationQueue posts={[tsuru, sinRevisar]} labels={LABELS} />);

    expect(screen.getByTestId(`moderation-approve-${tsuru.id}`)).toBeVisible();
    expect(screen.getByTestId(`moderation-reject-${tsuru.id}`)).toBeVisible();
    expect(
      screen.getByTestId(`moderation-approve-${sinRevisar.id}`),
    ).toBeVisible();
  });

  /* Sin motivo, el aviso que ve el autor no explicaría nada. El `required` lo impide antes de
     salir del navegador; la acción lo vuelve a comprobar en el servidor. */
  it("bajar exige elegir un motivo, y los ofrece los cinco", () => {
    render(<ModerationQueue posts={[tsuru]} labels={LABELS} />);

    const select = screen.getByTestId(`moderation-reason-${tsuru.id}`);

    expect(select).toBeRequired();
    expect(within(select).getAllByRole("option")).toHaveLength(6);
    expect(select).toHaveValue("");
  });
});

describe("ModerationQueue y las denuncias", () => {
  /* Denunciar AVISA, no oculta: decir "en revisión" sobre algo que cualquiera puede ver sería
     mentir en la única pantalla donde el admin decide. */
  it("una publicada que llegó por denuncias sigue diciendo que está publicada", () => {
    render(<ModerationQueue posts={[denunciada]} labels={LABELS} />);

    expect(
      screen.getByTestId(`moderation-status-${denunciada.id}`),
    ).toHaveTextContent("Publicada");
  });

  it("enseña cuánta gente avisó", () => {
    render(<ModerationQueue posts={[denunciada]} labels={LABELS} />);

    expect(
      screen.getByTestId(`moderation-reports-${denunciada.id}`),
    ).toHaveTextContent("3 reportes");
  });

  /* Sin denuncias no se pinta nada: un "0 reportes" competiria con el estado por la atencion del
     admin sin aportar nada. */
  it("sin denuncias no pinta la cuenta", () => {
    render(<ModerationQueue posts={[tsuru]} labels={LABELS} />);

    expect(
      screen.queryByTestId(`moderation-reports-${tsuru.id}`),
    ).not.toBeInTheDocument();
  });
});

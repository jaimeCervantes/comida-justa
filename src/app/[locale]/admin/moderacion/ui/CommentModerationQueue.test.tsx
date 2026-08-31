import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModeratedComment } from "~/use_cases/moderateComment/ports/ICommentModerationRepository";
import CommentModerationQueue, {
  type CommentQueueLabels,
} from "./CommentModerationQueue";

/* La acción es `"use server"`: importarla de verdad arrastraría `auth`, la conexión y `pg` a un
   entorno de jsdom. Lo que se prueba aquí es la pantalla, no la escritura. */
vi.mock("../actions", () => ({ decideCommentModeration: vi.fn() }));

const LABELS: CommentQueueLabels = {
  empty: "No hay comentarios esperando revisión.",
  columnComment: "Comentario",
  columnAuthor: "Quién lo escribió",
  columnPost: "Publicación",
  columnStatus: "Estado",
  columnReason: "Motivo",
  columnDate: "Desde",
  approve: "Publicar",
  reject: "Bajar",
  reasonPlaceholder: "— Elige un motivo —",
  statusInReview: "En revisión",
  statusRejected: "Retirado",
  statusPublished: "Publicado",
  viewPost: "Ver publicación",
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

const grosero: ModeratedComment = {
  id: "comment-grosero",
  content: "Esto es un insulto",
  postId: "post-dona",
  postSlug: "dona-chocolate-keto",
  postTitle: "Dona Chocolate Keto",
  status: "rejected",
  reason: "offensive",
  authorId: "user-jaime",
  authorName: "Jaime",
  createdAt: new Date("2026-08-14T09:00:00Z"),
  reviewedAt: new Date("2026-08-16T11:00:00Z"),
  reportCount: 0,
};

const sinRevisar: ModeratedComment = {
  ...grosero,
  id: "comment-sin-revisar",
  status: "in_review",
  reason: null,
  reviewedAt: null,
};

const denunciado: ModeratedComment = {
  ...grosero,
  id: "comment-denunciado",
  status: "published",
  reason: null,
  reportCount: 3,
};

describe("CommentModerationQueue", () => {
  it("con la bandeja vacía dice que no hay nada, en vez de una tabla hueca", () => {
    render(
      <CommentModerationQueue comments={[]} labels={LABELS} locale="es" />,
    );

    expect(screen.getByTestId("comment-moderation-empty")).toHaveTextContent(
      LABELS.empty,
    );
    expect(
      screen.queryByTestId("comment-moderation-queue"),
    ).not.toBeInTheDocument();
  });

  it("enseña el contenido, quién lo escribió y su estado", () => {
    render(
      <CommentModerationQueue
        comments={[grosero]}
        labels={LABELS}
        locale="es"
      />,
    );

    const row = screen.getByTestId(`comment-moderation-row-${grosero.id}`);

    expect(within(row).getByText("Esto es un insulto")).toBeVisible();
    expect(within(row).getByText("Jaime")).toBeVisible();
    expect(
      screen.getByTestId(`comment-moderation-status-${grosero.id}`),
    ).toHaveTextContent(LABELS.statusRejected);
  });

  it("enlaza a la publicación donde vive el comentario", () => {
    render(
      <CommentModerationQueue
        comments={[grosero]}
        labels={LABELS}
        locale="es"
      />,
    );

    const link = screen.getByRole("link", { name: grosero.postTitle });

    expect(link).toHaveAttribute("href", `/es/${grosero.postSlug}#comments`);
  });

  it("traduce el motivo guardado", () => {
    render(
      <CommentModerationQueue
        comments={[grosero]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.getByTestId(`comment-moderation-reason-label-${grosero.id}`),
    ).toHaveTextContent(LABELS.reasons.offensive);
  });

  it("sin motivo guardado no inventa ninguno", () => {
    render(
      <CommentModerationQueue
        comments={[sinRevisar]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.getByTestId(`comment-moderation-reason-label-${sinRevisar.id}`),
    ).toHaveTextContent("—");
  });

  it("ofrece publicar y bajar en cada fila", () => {
    render(
      <CommentModerationQueue
        comments={[grosero, sinRevisar]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.getByTestId(`comment-moderation-approve-${grosero.id}`),
    ).toBeVisible();
    expect(
      screen.getByTestId(`comment-moderation-reject-${grosero.id}`),
    ).toBeVisible();
  });

  it("bajar exige elegir un motivo, y los ofrece los cinco", () => {
    render(
      <CommentModerationQueue
        comments={[grosero]}
        labels={LABELS}
        locale="es"
      />,
    );

    const select = screen.getByTestId(
      `comment-moderation-reason-${grosero.id}`,
    );

    expect(select).toBeRequired();
    expect(within(select).getAllByRole("option")).toHaveLength(6);
    expect(select).toHaveValue("");
  });
});

describe("CommentModerationQueue y las denuncias", () => {
  it("un comentario publicado que llegó por denuncias sigue diciendo que está publicado", () => {
    render(
      <CommentModerationQueue
        comments={[denunciado]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.getByTestId(`comment-moderation-status-${denunciado.id}`),
    ).toHaveTextContent("Publicado");
  });

  it("enseña cuánta gente avisó", () => {
    render(
      <CommentModerationQueue
        comments={[denunciado]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.getByTestId(`comment-moderation-reports-${denunciado.id}`),
    ).toHaveTextContent("3 reportes");
  });

  it("sin denuncias no pinta la cuenta", () => {
    render(
      <CommentModerationQueue
        comments={[grosero]}
        labels={LABELS}
        locale="es"
      />,
    );

    expect(
      screen.queryByTestId(`comment-moderation-reports-${grosero.id}`),
    ).not.toBeInTheDocument();
  });
});

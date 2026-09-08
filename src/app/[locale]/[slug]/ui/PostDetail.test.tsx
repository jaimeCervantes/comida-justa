import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostDetail from "./PostDetail";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("~/i18n/messages/es.json")).default;

  return {
    getTranslations: async (namespace: "post" | "share") =>
      createTranslator({ locale: "es", messages, namespace }),
  };
});

vi.mock("~/infra/dataAccess/identity/sessionIdentity", () => ({
  findSellerOfUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: vi.fn(),
}));

vi.mock("~/presentation/post/stockAction", () => ({
  setStock: vi.fn(),
}));

vi.mock("~/presentation/cart/cartActions", () => ({
  addToCart: vi.fn(),
}));

vi.mock("~/presentation/location/actions", () => ({
  shareLocation: vi.fn(),
}));

vi.mock("~/presentation/post/EventAttendance/eventAttendanceAction", () => ({
  toggleEventAttendance: vi.fn(),
}));

vi.mock(
  "~/presentation/post/PracticePostReaction/practicePostReactionAction",
  () => ({
    setPracticePostReaction: vi.fn(),
  }),
);

vi.mock("~/i18n/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("~/i18n/navigation")>(
      "~/i18n/navigation",
    );

  return { ...actual, usePathname: () => "/practica-sleep-dark-room-ana" };
});

vi.mock("../categoryLabel", () => ({
  postCategoryLabel: vi.fn().mockResolvedValue("Sueño"),
}));

vi.mock("./PostLinks", () => ({
  default: () => <nav data-testid="post-links" />,
}));

const practicePost = {
  id: "practice-post-1",
  title: "Practiqué Penumbra total",
  content: "Apagué pantallas y dejé el cuarto en penumbra.",
  translations: [],
  media: [
    {
      url: "https://ruta/de/evidencia.webp",
      type: "image",
      alt: "Evidencia de Penumbra total",
    },
  ],
  createdAt: "2026-09-06T10:00:00.000Z",
  price: 999,
  kind: "practica",
  origin: "productor",
  category: "sueno_y_descanso",
  subCategory: null,
  contactInfo: {
    phone: "2781123456",
    whatsapp: "522781123456",
  },
  isAvailable: true,
  startsAt: null,
  endsAt: null,
  seller: null,
  sellerId: null,
  user: {
    id: "ana",
    name: "Ana Sana",
    username: "ana-sana",
  },
  reactionCount: 3,
  viewerReacted: false,
};

describe("PostDetail para publicaciones de práctica", () => {
  it("las presenta como avance sano y no como algo vendible", async () => {
    renderWithIntl(
      await PostDetail({
        post: practicePost,
        className: "",
        user: undefined,
        locale: "es",
        slug: "practica-sleep-dark-room-ana",
        bookingSlot: <div data-testid="booking-slot">Agenda</div>,
      }),
    );

    expect(screen.getByTestId("practice-detail-badge")).toHaveTextContent(
      "Práctica",
    );
    expect(screen.getByTestId("practice-detail-context")).toHaveTextContent(
      "Práctica saludable",
    );
    expect(screen.getByTestId("practice-detail-start")).toHaveAttribute(
      "href",
      "/practicas",
    );
    expect(screen.getByTestId("practice-post-reaction-signin")).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fpractica-sleep-dark-room-ana",
    );
    expect(
      screen.getByTestId("practice-post-reaction-count"),
    ).toHaveTextContent("3 apoyos");
    expect(screen.getByTestId("post-identity-author")).toHaveAttribute(
      "href",
      "/u/ana-sana",
    );
    expect(screen.queryByTestId("add-to-cart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("whatsapp-order")).not.toBeInTheDocument();
    expect(screen.queryByTestId("booking-slot")).not.toBeInTheDocument();
    expect(screen.queryByText(/\$999/)).not.toBeInTheDocument();
    expect(screen.getByTestId("post-meta")).not.toHaveTextContent(/\$/);
    expect(screen.getByTestId("post-meta")).not.toHaveTextContent("2781123456");
  });

  it("permite apoyar una práctica publicada cuando la persona inició sesión", async () => {
    renderWithIntl(
      await PostDetail({
        post: practicePost,
        className: "",
        user: { id: "luis", name: "Luis" },
        locale: "es",
        slug: "practica-sleep-dark-room-ana",
      }),
    );

    expect(
      screen.getByTestId("practice-post-reaction-toggle"),
    ).toHaveTextContent("Apoyar");
    expect(
      screen.getByTestId("practice-post-reaction-count"),
    ).toHaveTextContent("3 apoyos");
  });
});

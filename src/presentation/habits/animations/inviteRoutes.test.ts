import { describe, expect, it } from "vitest";
import { invitesOn } from "./inviteRoutes";

describe("Dónde cabe la invitación a ver los cuatro pilares", () => {
  it.each([
    { pathname: "/", slug: undefined, invites: true, why: "la portada" },
    {
      pathname: "/productos",
      slug: undefined,
      invites: true,
      why: "un listado",
    },
    {
      pathname: "/[slug]",
      slug: "jugo-verde",
      invites: true,
      why: "una publicación",
    },
    {
      pathname: "/pilares/[[...slug]]",
      slug: ["sueno"],
      invites: true,
      why: "la página de un pilar no tiene la animación",
    },
    {
      pathname: "/pilares/[[...slug]]",
      slug: undefined,
      invites: false,
      why: "la portada de los pilares ya la tiene",
    },
    {
      pathname: "/pilares/[[...slug]]",
      slug: [],
      invites: false,
      why: "la portada de los pilares, con el catch-all vacío",
    },
    {
      pathname: "/carrito",
      slug: undefined,
      invites: false,
      why: "una compra",
    },
    {
      pathname: "/pedido/[id]",
      slug: undefined,
      invites: false,
      why: "un pedido",
    },
    { pathname: "/publicar", slug: undefined, invites: false, why: "publicar" },
    {
      pathname: "/cuenta/agenda",
      slug: undefined,
      invites: false,
      why: "la cuenta",
    },
    {
      pathname: "/admin/moderacion",
      slug: undefined,
      invites: false,
      why: "administrar",
    },
    {
      pathname: "/auth/signin",
      slug: undefined,
      invites: false,
      why: "entrar",
    },
  ])("$pathname → $invites ($why)", ({ pathname, slug, invites }) => {
    expect(invitesOn(pathname, slug)).toBe(invites);
  });
});

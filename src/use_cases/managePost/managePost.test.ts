import { beforeEach, describe, expect, it, vi } from "vitest";
import PostValidator from "~/domain/schemas/PostValidator";
import {
  anuncio,
  archivos,
  BUCKET,
  evento,
  FakePostAdminRepository,
  jugoVerde,
  OWNER,
  SOMEONE_ELSE,
  servicio,
} from "./__fixtures__/postAdmin";
import type IPostAdminRepository from "./ports/IPostAdminRepository";
import SetPostAvailabilityUseCase from "./setPostAvailabilityUseCase";
import UpdateOnePostUseCase from "./updateOnePostUseCase";

describe("SetPostAvailabilityUseCase", () => {
  let repository: FakePostAdminRepository;
  let useCase: SetPostAvailabilityUseCase;

  beforeEach(() => {
    repository = new FakePostAdminRepository([jugoVerde, anuncio]);
    useCase = new SetPostAvailabilityUseCase(repository);
  });

  it("marca agotado un producto propio", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: OWNER,
      isAvailable: false,
    });

    expect(result.isAvailable).toBe(false);
    expect(repository.availabilityCalls).toEqual([[jugoVerde.id, false]]);
  });

  it("no deja tocar la publicación de otro", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: SOMEONE_ELSE,
      isAvailable: false,
    });

    expect(result.errorMessage).toBe(
      "Solo quien publicó puede editar esta publicación.",
    );
    expect(repository.availabilityCalls).toHaveLength(0);
  });

  it("ignora la disponibilidad en un anuncio, que no se agota", async () => {
    const result = await useCase.execute({
      postId: anuncio.id,
      userId: OWNER,
      isAvailable: false,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.availabilityCalls).toHaveLength(0);
  });

  it("avisa cuando la publicación ya no existe", async () => {
    const result = await useCase.execute({
      postId: "no-existe",
      userId: OWNER,
      isAvailable: false,
    });

    expect(result.errorMessage).toBe("Esa publicación ya no existe.");
  });
});

describe("UpdateOnePostUseCase", () => {
  let repository: FakePostAdminRepository;
  let useCase: UpdateOnePostUseCase;

  const edit = {
    slug: jugoVerde.slug,
    userId: OWNER,
    title: "Jugo Verde grande",
    content: "Nopal, apio, piña y perejil. Recién hecho, ahora de 500 ml.",
    contactPhone: "2781126948",
    price: 45,
    origin: "productor",
    category: "alimentacion",
    subCategory: "jugos",
    media: archivos("jugo-verde.jpg"),
  };

  beforeEach(() => {
    repository = new FakePostAdminRepository([jugoVerde]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());
  });

  it("guarda los cambios sin mover el slug", async () => {
    const result = await useCase.execute(edit);

    expect(result).toMatchObject({
      postId: jugoVerde.id,
      slug: "jugo-verde",
      textChanged: true,
    });
    expect(repository.updates[0]).toMatchObject({
      title: "Jugo Verde grande",
      contactPhone: "2781126948",
      price: 45,
    });
  });

  it("guarda el telefono de contacto", async () => {
    const result = await useCase.execute({
      ...edit,
      contactPhone: "+52 278 999 0011",
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0]).toMatchObject({
      contactPhone: "+52 278 999 0011",
    });
  });

  it("limpia el precio de un anuncio aunque venga forjado", async () => {
    repository = new FakePostAdminRepository([anuncio]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());

    const result = await useCase.execute({
      ...edit,
      slug: anuncio.slug,
      price: 99,
      origin: "productor",
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0]).toMatchObject({
      price: null,
      origin: null,
    });
  });

  it("avisa que el texto NO cambió, para no gastar una llamada al proveedor", async () => {
    const result = await useCase.execute({
      ...edit,
      title: jugoVerde.title,
      content: jugoVerde.content,
    });

    expect(result).toMatchObject({ textChanged: false });
    // El precio sí se guarda aunque el texto no cambie.
    expect(repository.updates).toHaveLength(1);
  });

  it("no deja editar la publicación de otro", async () => {
    const result = await useCase.execute({ ...edit, userId: SOMEONE_ELSE });

    expect(result.errorMessage).toBe(
      "Solo quien publicó puede editar esta publicación.",
    );
    expect(repository.updates).toHaveLength(0);
  });

  it("sigue exigiendo precio a un producto", async () => {
    const result = await useCase.execute({ ...edit, price: null });

    expect(result.errorMessage).toContain("precio");
    expect(repository.updates).toHaveLength(0);
  });

  it("corrige la procedencia sin mover nada más", async () => {
    const result = await useCase.execute({ ...edit, origin: "reventa_lejana" });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0]).toMatchObject({
      origin: "reventa_lejana",
      title: "Jugo Verde grande",
    });
  });

  /*
   * `resolveOriginForUser` deja en `null` la procedencia que un no-admin no puede declarar, así
   * que un request forjado con `hazlo_sano_propio` llega aquí sin procedencia. La edición se
   * rechaza en vez de guardar el producto desmarcado: descartar no puede terminar en un producto
   * que perdió lo que sí tenía declarado.
   */
  it("rechaza la edición que se quedó sin procedencia", async () => {
    const result = await useCase.execute({ ...edit, origin: null });

    expect(result.errorMessage).toContain("de dónde viene");
    expect(repository.updates).toHaveLength(0);
  });

  it("rechaza un título vacío", async () => {
    const result = await useCase.execute({ ...edit, title: "   " });

    expect(result.errorMessage).toBeDefined();
    expect(repository.updates).toHaveLength(0);
  });

  /*
   * Los archivos. Hasta este slice la edición no los tocaba —`updateOnePostUseCase` pasaba una lista
   * vacía solo para satisfacer al validador—, así que lo que sigue describe el camino nuevo: lo que
   * llega del formulario es **la lista completa que la publicación va a tener**, no un delta.
   */
  it("guarda la lista de archivos tal y como llega, que es el orden de la publicación", async () => {
    const result = await useCase.execute({
      ...edit,
      media: archivos("etiqueta.jpg", "frente.jpg", "interior.jpg"),
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0].media.map((file) => file.url)).toEqual([
      `${BUCKET}/etiqueta.jpg`,
      `${BUCKET}/frente.jpg`,
      `${BUCKET}/interior.jpg`,
    ]);
  });

  /* El tope es de la entidad y no del formulario: la base no limita las filas de `post_media`, así
     que sin esto una petición forjada dejaría una publicación con doscientos archivos. */
  it("rechaza una edición con más archivos de los que caben", async () => {
    const result = await useCase.execute({
      ...edit,
      media: archivos(
        ...Array.from({ length: 11 }, (_, index) => `foto-${index}.jpg`),
      ),
    });

    expect(result.errorMessage).toContain("10");
    expect(repository.updates).toHaveLength(0);
  });

  /* El vector se deriva del TEXTO. Cambiar qué fotos lleva no cambia lo que la publicación dice, así
     que reindexar aquí sería pagarle al proveedor por volver a calcular lo mismo. */
  it("no pide reindexar cuando solo cambiaron los archivos", async () => {
    const result = await useCase.execute({
      ...edit,
      title: jugoVerde.title,
      content: jugoVerde.content,
      media: archivos("frente.jpg", "etiqueta.jpg"),
    });

    expect(result).toMatchObject({ textChanged: false });
    expect(repository.updates[0].media).toHaveLength(2);
  });

  it("guarda las fechas de un evento", async () => {
    repository = new FakePostAdminRepository([evento]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());

    const startsAt = new Date("2027-09-05T07:15:00Z");
    const endsAt = new Date("2027-09-05T09:00:00Z");
    const result = await useCase.execute({
      ...edit,
      slug: evento.slug,
      price: null,
      origin: null,
      startsAt,
      endsAt,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0]).toMatchObject({ startsAt, endsAt });
  });

  it("rechaza un evento sin fecha de inicio", async () => {
    repository = new FakePostAdminRepository([evento]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());

    const result = await useCase.execute({
      ...edit,
      slug: evento.slug,
      price: null,
      origin: null,
      startsAt: null,
      endsAt: new Date("2027-09-05T09:00:00Z"),
    });

    expect(result.errorMessage).toContain("cuándo ocurre");
    expect(repository.updates).toHaveLength(0);
  });

  it("guarda precio y duración de un servicio", async () => {
    repository = new FakePostAdminRepository([servicio]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());

    const result = await useCase.execute({
      ...edit,
      slug: servicio.slug,
      price: 420,
      origin: null,
      durationMinutes: 60,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0]).toMatchObject({
      price: 420,
      durationMinutes: 60,
    });
  });

  it("rechaza un servicio sin duración", async () => {
    repository = new FakePostAdminRepository([servicio]);
    useCase = new UpdateOnePostUseCase(repository, new PostValidator());

    const result = await useCase.execute({
      ...edit,
      slug: servicio.slug,
      price: 420,
      origin: null,
      durationMinutes: null,
    });

    expect(result.errorMessage).toContain("cuánto dura");
    expect(repository.updates).toHaveLength(0);
  });

  it("propaga lo inesperado como mensaje genérico, no como pantalla en blanco", async () => {
    const broken: IPostAdminRepository = {
      findBySlug: vi.fn().mockResolvedValue(jugoVerde),
      findById: vi.fn(),
      setAvailability: vi.fn(),
      setStock: vi.fn(),
      updateContent: vi.fn().mockRejectedValue(new Error("connection refused")),
    };

    const result = await new UpdateOnePostUseCase(
      broken,
      new PostValidator(),
    ).execute(edit);

    expect(result.errorMessage).toBeDefined();
  });
});

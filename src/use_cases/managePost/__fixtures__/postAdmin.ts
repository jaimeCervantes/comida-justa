import type IPostAdminRepository from "../ports/IPostAdminRepository";
import type {
  EditablePost,
  PostContentUpdate,
  PostStockUpdate,
} from "../ports/IPostAdminRepository";

export const OWNER = "44pZIIJ5w1vSYkDQ6gfb";
export const SOMEONE_ELSE = "ksivIlKXNlbjXPMZBb4a";

/** `Hazlo Sano`, la única tienda con catálogo. */
export const STORE = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";
/** `Panadería de prueba`, que existe y no es la de nadie de aquí. */
export const OTHER_STORE = "7b64db9f-efb0-42f8-864c-573464341602";

export const BUCKET =
  "https://firebasestorage.googleapis.com/v0/b/hazlo-sano/o";

/** Los archivos que la publicación ya tiene guardados, en su `sort_order`. */
export function archivos(...names: string[]) {
  return names.map((name) => ({ url: `${BUCKET}/${name}`, type: "image" }));
}

// "Jugo Verde" a 40: producto real del catálogo de Hazlo Sano.
export const jugoVerde: EditablePost = {
  id: "post-jugo-verde",
  ownerId: OWNER,
  sellerId: STORE,
  slug: "jugo-verde",
  locale: "es",
  title: "Jugo Verde",
  content: "Nopal, apio, piña y perejil. Recién hecho.",
  contactPhone: "2781092116",
  price: 40,
  kind: "producto",
  // `EditablePost` lo exige. Faltaba, y llegaba como `undefined` en vez de `null`.
  origin: null,
  category: "alimentacion",
  subCategory: "jugos",
  /* Los tres son de una publicación con fecha —un evento o un servicio que se agenda—, y este es
     un producto: van en `null`, que es lo que el tipo pide y lo que la base guarda. */
  startsAt: null,
  endsAt: null,
  durationMinutes: null,
  isAvailable: true,
  /* Nulo, como las 432 filas del día de la migración: no lleva inventario. Las pruebas que sí lo
     necesitan lo ponen. */
  stockQuantity: null,
  media: archivos("jugo-verde.jpg"),
};

export const anuncio: EditablePost = {
  ...jugoVerde,
  id: "post-anuncio",
  slug: "aviso-de-la-comunidad",
  title: "Aviso de la comunidad",
  kind: "anuncio",
  price: null,
};

export const evento: EditablePost = {
  ...jugoVerde,
  id: "post-rodada-nocturna",
  slug: "rodada-nocturna",
  title: "Rodada nocturna",
  kind: "evento",
  price: null,
  origin: null,
  startsAt: new Date("2027-09-04T18:30:00Z"),
  endsAt: new Date("2027-09-04T20:00:00Z"),
};

export const servicio: EditablePost = {
  ...jugoVerde,
  id: "post-sesion-respiracion",
  slug: "sesion-respiracion",
  title: "Sesion de respiracion",
  kind: "servicio",
  price: 350,
  origin: null,
  durationMinutes: 45,
};

export class FakePostAdminRepository implements IPostAdminRepository {
  readonly availabilityCalls: Array<[string, boolean]> = [];
  readonly stockUpdates: PostStockUpdate[] = [];
  readonly updates: PostContentUpdate[] = [];

  constructor(private readonly posts: EditablePost[] = []) {}

  async findBySlug(slug: string): Promise<EditablePost | null> {
    return this.posts.find((post) => post.slug === slug) ?? null;
  }

  async findById(postId: string): Promise<EditablePost | null> {
    return this.posts.find((post) => post.id === postId) ?? null;
  }

  async setAvailability(postId: string, isAvailable: boolean): Promise<void> {
    this.availabilityCalls.push([postId, isAvailable]);
  }

  async setStock(update: PostStockUpdate): Promise<void> {
    this.stockUpdates.push(update);
  }

  async updateContent(update: PostContentUpdate): Promise<void> {
    this.updates.push(update);
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTaxonomy } from "~/domain/entities/post/__fixtures__/categoryTaxonomy";

const {
  auth,
  isAdmin,
  createCategoryRepo,
  setActiveRepo,
  getTaxonomy,
  updateTag,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdmin: vi.fn(),
  createCategoryRepo: vi.fn(),
  setActiveRepo: vi.fn(),
  getTaxonomy: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag }));
vi.mock("~/infra/auth", () => ({ auth }));
vi.mock("~/infra/auth/isAdmin", () => ({ isAdmin }));
vi.mock("~/infra/dataAccess/categories/factory", () => ({
  createCategoryTaxonomyRepository: () => ({
    createCategory: createCategoryRepo,
    setCategoryActive: setActiveRepo,
  }),
}));
vi.mock("~/infra/dataAccess/categories/cachedCategoryTaxonomy", () => ({
  CATEGORY_TAXONOMY_TAG: "category-taxonomy",
  getCategoryTaxonomy: getTaxonomy,
}));

import { createCategory, setCategoryActive } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const VALID = {
  key: "conservas",
  parentKey: "alimentacion",
  labelEs: "Conservas",
  labelEn: "Preserves",
};

describe("las acciones de /admin/catalogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    getTaxonomy.mockResolvedValue(makeTaxonomy());
    createCategoryRepo.mockResolvedValue(undefined);
    setActiveRepo.mockResolvedValue(undefined);
  });

  describe("createCategory", () => {
    it("saves the category with its labels", async () => {
      const state = await createCategory({ errors: {} }, form(VALID));

      expect(createCategoryRepo).toHaveBeenCalledWith({
        key: "conservas",
        parentKey: "alimentacion",
        labels: { es: "Conservas", en: "Preserves" },
      });
      expect(state.created).toBe("conservas");
      expect(state.errors).toEqual({});
    });

    /**
     * Sin esto, la categoría recién creada no se vería hasta que expirara el TTL de una hora: quien
     * la acaba de agregar entraría a `/publicar` y no la encontraría.
     */
    it("refreshes the cached catalog", async () => {
      await createCategory({ errors: {} }, form(VALID));

      expect(updateTag).toHaveBeenCalledWith("category-taxonomy");
    });

    it("treats an empty parent as a new root category", async () => {
      await createCategory({ errors: {} }, form({ ...VALID, parentKey: "" }));

      expect(createCategoryRepo).toHaveBeenCalledWith(
        expect.objectContaining({ parentKey: null }),
      );
    });

    describe("when the input is invalid", () => {
      it("does not touch the database", async () => {
        const state = await createCategory(
          { errors: {} },
          form({ ...VALID, key: "MAL" }),
        );

        expect(createCategoryRepo).not.toHaveBeenCalled();
        expect(updateTag).not.toHaveBeenCalled();
        expect(state.errors.key).toBeDefined();
      });

      it("rejects a key the catalog already has", async () => {
        const state = await createCategory(
          { errors: {} },
          form({ ...VALID, key: "jugos" }),
        );

        expect(state.errors.key).toMatch(/ya existe/i);
        expect(createCategoryRepo).not.toHaveBeenCalled();
      });
    });

    // Una Server Action es un endpoint: se puede invocar sin pasar por la página.
    it("refuses a caller who is not an admin", async () => {
      isAdmin.mockReturnValue(false);

      const state = await createCategory({ errors: {} }, form(VALID));

      expect(createCategoryRepo).not.toHaveBeenCalled();
      expect(state.errors.form).toMatch(/permiso/i);
    });

    /**
     * La base tiene la última palabra: dos administradores a la vez pasan la validación con la
     * misma clave y solo uno gana. El otro merece un mensaje, no una pantalla de error.
     */
    it("turns a database failure into a message instead of a crash", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      createCategoryRepo.mockRejectedValue(new Error("duplicate key"));

      const state = await createCategory({ errors: {} }, form(VALID));

      expect(state.errors.form).toBeDefined();
      expect(state.created).toBeUndefined();
      expect(updateTag).not.toHaveBeenCalled();
    });
  });

  describe("setCategoryActive", () => {
    it.each([
      ["true", true],
      ["false", false],
    ])("passes isActive=%s through", async (given, expected) => {
      await setCategoryActive(form({ key: "jugos", isActive: given }));

      expect(setActiveRepo).toHaveBeenCalledWith("jugos", expected);
      expect(updateTag).toHaveBeenCalledWith("category-taxonomy");
    });

    it("refuses a caller who is not an admin", async () => {
      isAdmin.mockReturnValue(false);

      await setCategoryActive(form({ key: "jugos", isActive: "false" }));

      expect(setActiveRepo).not.toHaveBeenCalled();
    });

    it("does nothing without a key", async () => {
      await setCategoryActive(form({ isActive: "false" }));

      expect(setActiveRepo).not.toHaveBeenCalled();
    });
  });
});

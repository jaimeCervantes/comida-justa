import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import CategoryTree from "./ui/CategoryTree";
import NewCategoryForm from "./ui/NewCategoryForm";

export const metadata: Metadata = {
  title: "Catálogo de categorías - Hazlo Sano",
  description: "Administración interna de la taxonomía de categorías.",
  robots: { index: false, follow: false },
};

export default async function CatalogoPage() {
  const session = await auth();

  // 404 en vez de 403: una página interna no tiene por qué revelar que existe.
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const taxonomy = await getCategoryTaxonomy();
  const nodes = [...taxonomy.nodes.values()];

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">Catálogo de categorías</h1>

      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Lo que se ve aquí es lo que ofrece <strong>/publicar</strong> y lo que
        filtran el buscador y el chatbot. Agregar una categoría ya no necesita
        migración; desactivar una la saca del selector{" "}
        <strong>sin tocar</strong> las publicaciones que ya la usan.
      </p>

      <CategoryTree nodes={nodes} />

      <NewCategoryForm roots={optionsFor(taxonomy, null, "es")} />
    </main>
  );
}

import { getTranslations } from "next-intl/server";
import type { Post } from "~/infra/types/Posts";
import { Heading } from "~/presentation/design_system/typography/Heading";
import CardForList from "~/presentation/post/CardForList/CardForList";

/**
 * Lo que se parece a esta publicación, según el mismo vector con el que busca el chatbot.
 *
 * El encabezado existía desde antes **vacío**: un `<h2>` prometiendo publicaciones relacionadas
 * seguido de nada. Ahora, si la base no devuelve vecinos —una publicación recién creada sin
 * vector, por ejemplo—, se dice que no hay en vez de dejar el hueco.
 */
export default async function RelatedPosts({
  posts,
  viewerId,
  className = "",
}: {
  posts: Post[];
  className?: string;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = await getTranslations("post");

  return (
    <aside
      className={`sm:flex-1 ${className}`}
      aria-labelledby="related-heading"
      data-testid="related-posts"
    >
      {/* Por el sistema y no con clases sueltas: escrito a mano era `text-3xl font-bold`, el mismo
          tamaño que el título de la publicación y con más peso, así que el vecindario pesaba más
          que la publicación que se venía a leer. `level={2}` trae su propio tamaño. */}
      <Heading level={2} id="related-heading" className="mb-4">
        {t("related")}
      </Heading>

      {posts.length === 0 ? (
        <p className="text-gray-500">{t("relatedEmpty")}</p>
      ) : (
        <ul className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] list-none p-0">
          {posts.map((post) => (
            <li key={String(post.id)}>
              <CardForList {...post} viewerId={viewerId} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildIndexingReport } from "~/domain/entities/post/indexingReport";
import { buildOriginReport } from "~/domain/entities/post/originReport";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import IndexingStatusPanel from "./ui/IndexingStatusPanel";
import OriginReportTable from "./ui/OriginReportTable";

export const metadata: Metadata = {
  title: "Productos por procedencia - Hazlo Sano",
  description: "Reporte interno de productos publicados, agrupados por procedencia.",
  robots: { index: false, follow: false },
};

export default async function ProductosPorProcedenciaPage() {
  const session = await auth();

  // 404 en vez de 403: una página interna no tiene por qué revelar que existe.
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const postRepo = createPostQueryRepository();
  const [originCounts, indexingCounts] = await Promise.all([
    postRepo.getProductCountsByOrigin(),
    postRepo.getProductIndexingCounts(),
  ]);

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">Productos por procedencia</h1>

      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Publicaciones con tipo <strong>producto</strong>, agrupadas por su procedencia.
        Los anuncios no se cuentan aquí.
      </p>

      <OriginReportTable {...buildOriginReport(originCounts)} />

      <hr className="my-8 border-gray-200 dark:border-gray-800" />

      <IndexingStatusPanel {...buildIndexingReport(indexingCounts)} />
    </main>
  );
}

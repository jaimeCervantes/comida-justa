import { notFound } from "next/navigation";
import SuenoPage from "../components/SuenoPage";
import AlimentacionPage from "../components/AlimentacionPage";
import MovimientoPage from "../components/MovimientoPage";
import MenteEspirituPage from "../components/MenteEspirituPage";

type Props = {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
};

export default async function PilaresPage({ params }: Props) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return notFound();
  }

  const pillarSlug = slug[0];

  switch (pillarSlug) {
    case "sueno":
      return <SuenoPage />;
    case "alimentacion":
      return <AlimentacionPage />;
    case "movimiento":
      return <MovimientoPage />;
    case "mente-espiritu":
      return <MenteEspirituPage />;
    default:
      return notFound();
  }
}

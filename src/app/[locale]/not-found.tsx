import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/presentation/design_system/buttons/Button";

export default async function NotFound() {
  const headersList = await headers();
  const mappedHeaders = Array.from(headersList);

  return (
    <section className="flex flex-col justify-center gap-4 items-center">
      <h1 className="text-2xl md:text-3xl font-bold">
        ¡Recurso no encontrado!
      </h1>

      <h2 className="text-xl md:text-2xl font-bold hidden md:block">
        Probablemente se fue a hacer una serie extra de burpees... ¡y se agotó!
      </h2>

      <h3 className="text-lg md:text-xl font-bold">
        A veces, incluso un recurso necesita un descanso.
      </h3>

      <Image
        src="/404/404.webp"
        alt="A veces, incluso un recurso necesita un descanso"
        width={462}
        height={283}
      />

      <h4 className="md:tex-3xl font-bold">
        Mientras se recupera, tú puedes continuar cuidando tu salud, tu tiempo.
        Encuentra lo que necesitas aquí:
      </h4>

      <p>
        <Link href="/">
          <Button color="green">Ir al inicio</Button>
        </Link>
      </p>
    </section>
  );
}

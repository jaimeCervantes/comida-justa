import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Heading } from "~/presentation/design_system/typography/Heading";

export default async function NotFound() {
  const headersList = await headers();
  const _mappedHeaders = Array.from(headersList);

  return (
    <html lang="es">
      <body>
        <section className="flex flex-col justify-center gap-4 items-center min-h-screen">
          <Heading level={1} size="md">
            ¡Recurso no encontrado!
          </Heading>

          <Heading level={2} className="hidden md:block">
            Probablemente se fue a hacer una serie extra de burpees... ¡y se
            agotó!
          </Heading>

          <Heading level={3}>
            A veces, incluso un recurso necesita un descanso.
          </Heading>

          <Image
            src="/404/404.webp"
            alt="A veces, incluso un recurso necesita un descanso"
            width={462}
            height={283}
          />

          <Heading level={4}>
            Mientras se recupera, tú puedes continuar cuidando tu salud, tu
            tiempo. Encuentra lo que necesitas aquí:
          </Heading>

          <p>
            <Link href="/">
              <Button color="green">Ir al inicio</Button>
            </Link>
          </p>
        </section>
      </body>
    </html>
  );
}

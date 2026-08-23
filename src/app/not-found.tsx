import Link from "next/link";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * El 404 de la raíz: el que sale cuando la dirección ni siquiera llegó a tener idioma.
 *
 * **Está en español a mano, y no es un descuido.** Vive fuera de `[locale]`, así que no hay
 * `NextIntlClientProvider` ni `getTranslations` que valgan —es la misma razón por la que `Badge`
 * recibe su texto ya traducido—. Y es español porque a esta altura no hay ruta de la que deducir el
 * idioma: la comunidad es de Xalapa y el sitio por omisión habla español.
 *
 * Dice lo mismo que su gemelo de `[locale]`, con menos: sin sugerencias, porque los destinos que
 * ofrecería son rutas traducidas y aquí el idioma todavía no está decidido. Pinta su propio
 * `<html>` porque no hay layout encima.
 */
export default function NotFound() {
  return (
    <html lang="es">
      <body>
        <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 p-6">
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
            404
          </span>

          <Heading level={1}>Esta página se cosechó ya</Heading>

          <p className="text-body text-text-support">
            La publicación que buscabas se venció o la borró quien la subió.
            Pasa, y no es tu culpa.
          </p>

          <p className="mt-2">
            <Link href="/">
              <Button color="green">Ver lo que hay hoy</Button>
            </Link>
          </p>
        </section>
      </body>
    </html>
  );
}

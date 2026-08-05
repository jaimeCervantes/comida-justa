import { readVisitorFix } from "~/infra/location/visitorLocation";
import LocationChip from "./LocationChip";
import LocationNotice from "./LocationNotice";

/**
 * Lo que cada sección dice sobre la ubicación de quien mira, sepamos dónde está o no.
 *
 * Las dos caras viven detrás de un solo componente porque son la misma decisión, y antes esa
 * decisión estaba repetida en seis páginas con la forma `{visitor ? null : <LocationNotice/>}`. El
 * `null` era el problema: en cuanto sabíamos dónde estaba alguien, la sección se quedaba **muda**,
 * y con ella desaparecía la única vía para corregir una ubicación equivocada.
 *
 * Lee la ubicación por su cuenta en vez de recibirla: `readVisitorFix` va en `cache()`, así que en
 * la misma petición esta lectura no cuesta nada, y a cambio ninguna página tiene que enhebrar la
 * fecha por su `data.ts` solo para pintar un aviso.
 */
export default async function LocationBanner({
  showSellerCta,
  className = "",
}: {
  /** `false` para quien ya abrió su tienda: ese ya no necesita que se lo cuenten. */
  showSellerCta: boolean;
  className?: string;
}) {
  const fix = await readVisitorFix();

  return fix ? (
    <LocationChip fix={fix} className={className} />
  ) : (
    <LocationNotice showSellerCta={showSellerCta} className={className} />
  );
}

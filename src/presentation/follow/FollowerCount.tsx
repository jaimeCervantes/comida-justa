import { useTranslations } from "next-intl";
import { showsFollowerCount } from "~/domain/follow/follow";

/**
 * Cuántos siguen a esta página, o nada.
 *
 * **Con cero no se pinta**, y vale igual para quien mira y para quien es dueño. Antes al dueño se
 * le enseñaba en su lugar un «comparte tu página para conseguir tus primeros seguidores», y eso
 * hacía justo lo contrario de lo que se buscaba al callar el cero: anunciaba la página vacía a la
 * única persona a la que no conviene desanimar — y al lado de un botón de compartir que ya estaba
 * ahí, así que además sobraba el consejo.
 *
 * Una sola regla para los dos. Lo único que distingue al dueño es que no se le ofrece seguirse.
 */
export default function FollowerCount({ total }: { total: number }) {
  const t = useTranslations("follow");

  if (!showsFollowerCount(total)) return null;

  return (
    <span
      data-testid="follower-count"
      className="text-sm text-gray-600 dark:text-gray-400"
    >
      {t("count", { total })}
    </span>
  );
}

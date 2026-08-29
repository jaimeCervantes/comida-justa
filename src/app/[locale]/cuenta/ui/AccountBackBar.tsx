import { useTranslations } from "next-intl";
import { MdArrowBack } from "react-icons/md";
import { Link } from "~/i18n/navigation";

/**
 * El hilo de vuelta a la cuenta, para una página que **no puede** llevar el menú entero.
 *
 * `/u/[username]` se alcanza desde «Mis publicaciones», dentro de `AccountNav`, y hasta aquí era un
 * callejón sin salida: se entraba a la cuenta y se salía de ella sin darse cuenta. La corrección
 * evidente —montar `AccountSection`— es justo la que no vale ahí: ese perfil es **la página pública
 * que ve cualquiera**, así que darle a su dueño una columna de menú que sus visitantes no ven le
 * enseñaría su perfil distinto de como lo está repartiendo.
 *
 * Así que en vez del menú, el hilo: de dónde vienes y dónde estás, en un renglón. Se pinta **solo
 * para el dueño** —a quien mira el perfil de otra persona, «Mi cuenta» no le dice nada de esta
 * página— y por eso la decisión de montarlo la toma la página, que es la que sabe quién mira.
 *
 * `current` llega ya traducido en vez de una clave: el `AGENTS.md` prohíbe componer claves en
 * tiempo de ejecución, y una unión de claves para un solo llamador sería ceremonia. Vive junto a
 * `AccountNav` y no en `u/[username]/ui/` porque es chrome de la cuenta: el día que la sección
 * cambie de aspecto, sus dos formas tienen que cambiar en el mismo sitio.
 */
export default function AccountBackBar({ current }: { current: string }) {
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("myAccount")}
      data-testid="account-back-bar"
      className="mb-6 flex items-center gap-2 text-sm"
    >
      <Link
        href="/cuenta"
        className="focus-ring inline-flex items-center gap-1.5 rounded-control px-2 py-1 font-medium text-highlight hover:bg-surface-elevation-2"
      >
        <MdArrowBack aria-hidden />
        {t("myAccount")}
      </Link>

      <span aria-hidden className="text-text-muted">
        ·
      </span>

      <span aria-current="page" className="font-semibold text-text-base">
        {current}
      </span>
    </nav>
  );
}

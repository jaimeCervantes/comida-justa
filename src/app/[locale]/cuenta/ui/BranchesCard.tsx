import { useTranslations } from "next-intl";
import { MdAdd, MdExpandMore } from "react-icons/md";
import type { Branch } from "~/domain/entities/seller/types";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import BranchList from "~/presentation/directory/BranchList/BranchList";
import type { AddBranchState } from "../actions";
import { ANCHOR } from "../anchors";
import AccountCard from "./AccountCard";
import AddBranchForm from "./AddBranchForm";

/**
 * Las sucursales: las que hay y el alta de una más, en la misma tarjeta.
 *
 * **Antes eran dos bloques en columnas distintas.** «Tus sucursales» a la izquierda —del lado de
 * «lo que se enseña»— y «Agrega una sucursal» a la derecha —del lado de «lo que se edita»—: la
 * misma tarea a media pantalla de distancia, y en un teléfono a tres tarjetas de desplazamiento.
 * El corte era coherente con el criterio de la página, y por eso el slice 1 cambió el criterio.
 *
 * **El alta se pliega cuando ya hay al menos una.** Cuatro campos y un botón de geolocalización
 * permanentemente abiertos dominaban la tarjeta aunque tuvieras tres sucursales dadas de alta. Pero
 * **sin ninguna arranca abierta**: plegarla ahí escondería la única acción de la tarjeta detrás de
 * un clic de más, y quien no tiene ninguna viene justamente a dar de alta la primera.
 *
 * **Se pliega con `<details>` y no con estado de React.** Es un desplegable, que es exactamente lo
 * que ese elemento resuelve: funciona antes de que hidrate nada, el navegador le pone el
 * `aria-expanded` y no añade un componente de cliente a una página que ya tiene cinco. El `open`
 * inicial lo decide el servidor con el dato que ya tiene —cuántas sucursales hay—, así que la
 * tarjeta llega al navegador ya en la forma correcta y no parpadea.
 */
export default function BranchesCard({
  branches,
  action,
}: {
  branches: Branch[];
  action: (state: AddBranchState, data: FormData) => Promise<AddBranchState>;
}) {
  const t = useTranslations("account");
  const tBranches = useTranslations("branches");
  const isFirst = branches.length === 0;

  return (
    <AccountCard
      id={ANCHOR.branches}
      title={t("branchesHeading")}
      intro={t("branchesIntro")}
      testId="branches-card"
    >
      <BranchList
        branches={branches}
        emptyMessage={tBranches("emptyWithoutLocation")}
      />

      <details open={isFirst} className="mt-4 group" data-testid="add-branch">
        <summary
          data-testid="add-branch-toggle"
          /* `list-none` y el marcador de WebKit ocultos: sin las dos, el triángulo del navegador
             sale dentro del botón. El icono propio dice lo mismo y gira al abrirse. */
          className={cn(
            buttonVariants({ size: "sm", color: "white" }),
            "w-full cursor-pointer list-none justify-start border border-separator [&::-webkit-details-marker]:hidden",
          )}
        >
          <MdAdd size="18" aria-hidden className="mr-1.5 shrink-0" />
          {t(isFirst ? "addBranchOpenFirst" : "addBranchOpen")}
          <MdExpandMore
            size="18"
            aria-hidden
            className="ml-auto shrink-0 transition-transform duration-(--duration-base) ease-(--ease-natural) group-open:rotate-180"
          />
        </summary>

        <div className="mt-4">
          <p className="mb-4 text-sm text-text-support">
            {t("addBranchIntro")}
          </p>
          <AddBranchForm action={action} />
        </div>
      </details>
    </AccountCard>
  );
}

import { getTranslations } from "next-intl/server";
import Breadcrumbs, { type Crumb } from "~/presentation/navigation/Breadcrumbs";
import { groupsTrail, outreachTrail } from "../outreachTrail";

interface OutreachBreadcrumbsProps {
  /** Lo que sigue al tramo común; el último paso es la página que se ve. */
  steps?: Crumb[];
  /** Si la pantalla cuelga de «Grupos». */
  inGroups?: boolean;
}

/**
 * Las migas de toda pantalla de difusión, con el mismo componente que el catálogo. El tramo común
 * lo pone esto; cada página solo dice su final.
 */
export default async function OutreachBreadcrumbs({
  steps = [],
  inGroups = false,
}: OutreachBreadcrumbsProps) {
  const [tCommon, t] = await Promise.all([
    getTranslations("common"),
    getTranslations("outreach"),
  ]);
  const labels = {
    home: tCommon("home"),
    outreach: t("listHeading"),
    groups: t("groupsHeading"),
  };

  return (
    <Breadcrumbs
      items={
        inGroups
          ? groupsTrail(labels, ...steps)
          : outreachTrail(labels, ...steps)
      }
      ariaLabel={tCommon("breadcrumb")}
      className="mb-3"
    />
  );
}

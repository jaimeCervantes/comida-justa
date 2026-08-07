import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import Avatar from "~/presentation/user/Avatar";
import FormattedDate from "./FormattedDate";
import type { CardProps } from "./types";

export default function Card({
  title,
  media,
  createdAt,
  className,
  Container = "article",
  style = {},
  user = {},
  footerChildren = null,
  AnchorElement = "a",
  anchorProps = {},
  children,
}: CardProps) {
  return (
    <Surface
      as={Container}
      radius="2xl"
      background="raised"
      border="subtle"
      elevation="md"
      interactive
      className={cn(
        "overflow-hidden group hover:ring-2 hover:ring-pw-orange",
        className,
      )}
      style={style ?? {}}
    >
      {media}
      <section className="p-5 flex flex-col grow">
        <h3 className="mb-3 text-body-lg font-bold leading-tight group-hover:text-pw-lightgreen transition-colors">
          <AnchorElement {...anchorProps}>{title}</AnchorElement>
        </h3>
        {children}
        <div className="mt-auto flex justify-start gap-3 items-center pt-4 border-t border-separator">
          <Avatar user={user} />
          <div className="flex flex-col text-label text-text-support">
            <span className="font-medium text-text-base">
              {user.displayName}
            </span>
            <FormattedDate isoDateString={createdAt} />
          </div>
        </div>
      </section>

      {footerChildren && (
        <footer className="flex flex-wrap p-2">{footerChildren}</footer>
      )}
    </Surface>
  );
}

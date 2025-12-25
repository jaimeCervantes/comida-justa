import Avatar from "../Avatar";
import type { CardProps } from "./Card.d";
import FormattedDate from "./FormattedDate";

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
  const clsN =
    `bg-white dark:bg-pw-gray rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-800 ${
      className ?? ""
    }`.trim();

  return (
    <Container className={clsN} style={style ?? ""}>
      {media}
      <section className="p-5 flex flex-col flex-grow">
        <h3 className="mb-3 text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-pw-green transition-colors">
          <AnchorElement {...anchorProps}>{title}</AnchorElement>
        </h3>
        {children}
        <div className="mt-auto flex justify-start gap-3 items-center pt-4 border-t border-gray-100 dark:border-gray-800">
          <Avatar user={user} />
          <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {user.displayName}
            </span>
            <FormattedDate isoDateString={createdAt} />
          </div>
        </div>
      </section>

      {footerChildren && (
        <footer className="flex flex-wrap p-2">{footerChildren}</footer>
      )}
    </Container>
  );
}

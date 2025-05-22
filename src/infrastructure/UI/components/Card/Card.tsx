import Avatar from "../Avatar";
import type { CardProps } from "./Card.d";

export default function Card({
  title,
  media,
  createdAt,
  createdAtLocale,
  className,
  Container = "article",
  style = {},
  user = {},
  footerChildren = null,
  AnchorElement = "a",
  anchorProps = {},
  children,
}: CardProps) {
  const clsN = `bg-white dark:bg-pw-gray rounded-3xl overflow-hidden hover:border-b-pw-lightgreen dark:border-t-0 dark:border-r-0 dark:border-l-0 border-b-8 border-b-transparent transition-all duration-500 hover:ring-1 hover:ring-pw-lightgreen ${className ?? ""}`.trim();

  return (
    <Container className={clsN} style={style ?? ""}>
      {media}
      <section className="p-4">
        <h3 className="mb-4">
          <AnchorElement {...anchorProps}>{title}</AnchorElement>
        </h3>
        {children}
        <div className="flex justify-start gap-2 items-center">
          <Avatar user={user} />
          <p className="flex flex-col">
            {user.displayName}
            <time
              dateTime={createdAt?.toString()}
              className="first-letter:uppercase text-sm text-gray-500 dark:text-pw-white"
            >
              {createdAtLocale}
            </time>
          </p>
        </div>
      </section>

      {footerChildren && (
        <footer className="flex flex-wrap p-2">{footerChildren}</footer>
      )}
    </Container>
  );
}

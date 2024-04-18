import Avatar from "../Avatar";
import type { CardProps } from "./Card.d";

export default function Card({
  title,
  image,
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
  const clsN = `border bg-white-300 shadow-md ${className ?? ""}`.trim();

  return (
    <Container className={clsN} style={style ?? ""}>
      <AnchorElement {...anchorProps}>
        <img
          src={image.src}
          alt={image.alt}
          width={image.width ?? 300}
          height={image.height ?? 300}
          loading={image.loading ?? "lazy"}
          className="h-auto max-w-full w-full object-cover aspect-video"
        />
      </AnchorElement>

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

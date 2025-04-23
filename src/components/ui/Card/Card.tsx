import Avatar from "../Avatar";
import type { CardProps } from "./Card.d";
import MediaContent from "../MediaContent/MediaContent";

export default function Card({
  title,
  media,
  fileType,
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
  middleFooter,
}: CardProps) {
  console.log("fileType:", fileType);
  const clsN = `border bg-white-300 shadow-md ${className ?? ""}`.trim();

    // Definir mediaContent
    const mediaContent = media?.url ? (
      <MediaContent
      media={{
        type: fileType?.startsWith("video") ? "video" : "image",
        url: media.url,
        alt: media.alt || title,
      }}
      options={{
        imageProps: {
          width: Number(media.width) || 300,
          height: Number(media.height) || 300,
          loading: media.loading ?? "lazy",
          className: "h-auto max-w-full w-full object-cover aspect-video",
        },
        videoProps: {
          width: Number(media.width) || 300,
          height: Number(media.height) || 300,
          controls: true,
          className: "h-auto max-w-full w-full object-cover aspect-video",
        },
      }}
      />
    ) : null;
  
    return (
      <Container className={clsN} style={style ?? {}}>
        {/* Contenido multimedia */}
        {mediaContent}
  
        {/* Contenido principal */}
        <section className="p-4">
          <h3 className="mb-4">
            <AnchorElement {...anchorProps}>{title}</AnchorElement>
          </h3>
  
          {/* Footer intermedio */}
          {middleFooter && (
            <div className="mb-4 text-base text-gray-800 dark:text-gray-200">
              {middleFooter}
            </div>
          )}
  
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
  
        {/* Footer adicional */}
        {footerChildren && (
          <footer className="flex flex-wrap p-2">{footerChildren}</footer>
        )}
      </Container>
    );
  }
import { type AppHref, Link } from "~/i18n/navigation";

export default function AtomicChallengeCta({
  href,
  title,
  body,
}: {
  href: AppHref;
  title: string;
  body: string;
}): React.ReactNode {
  return (
    <section className="rounded-3xl border border-separator bg-surface-elevation-2 p-6 sm:p-8">
      <h2 className="text-2xl font-black text-text-strong">{title}</h2>
      <p className="mt-2 text-body">{body}</p>
      <div className="mt-4 text-center">
        <Link
          href={href}
          className="focus-ring inline-flex rounded-lg bg-pw-green px-5 py-3 font-bold text-white"
        >
          {title}
        </Link>
      </div>
    </section>
  );
}

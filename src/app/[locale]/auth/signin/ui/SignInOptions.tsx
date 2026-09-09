"use client";

import Image from "next/image";
import { getProviders, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Providers = Awaited<ReturnType<typeof getProviders>>;

/**
 * Los proveedores con los que se puede entrar, y a dónde se sale después.
 *
 * **`callbackUrl` se pasa siempre, aunque parezca redundante.** Sin él, el cliente de next-auth
 * usa por omisión `window.location.href`, que aquí es *esta misma pantalla*: era el segundo corte
 * del viaje de vuelta —el destino llegaba en la URL y moría en este `onClick`—. Quien llama ya lo
 * validó, así que aquí solo se reenvía.
 */
export default function SignInOptions({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const t = useTranslations("auth");
  const [providers, setProviders] = useState<Providers>(null);

  useEffect(() => {
    getProviders().then((p) => setProviders(p));
  }, []);

  return (
    <section
      aria-label={t("optionsLabel")}
      className="mx-auto flex w-full max-w-lg items-center justify-center px-0 sm:px-4"
    >
      <div className="w-full overflow-hidden rounded-card bg-surface-elevation-1/70 shadow-xl ring-1 ring-separator backdrop-blur-md">
        <div className="flex flex-col items-center gap-5 p-6 text-center sm:p-8 md:p-10">
          <div
            data-testid="signin-artwork"
            className="flex aspect-square size-32 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-xs sm:size-36"
          >
            <Image
              loading="eager"
              src="/logo.webp"
              alt=""
              aria-hidden
              className="h-full w-full object-contain"
              width={144}
              height={144}
            />
          </div>

          <p className="text-sm md:text-base text-text-support max-w-prose">
            {t("intro")}
          </p>

          <div className="w-full space-y-3">
            {providers &&
              Object.values(providers).map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => signIn(provider.id, { callbackUrl })}
                  aria-label={`Sign in with ${provider.name}`}
                  className="focus-ring w-full flex items-center justify-between gap-3 py-3 px-4 bg-surface-elevation-1 border border-separator rounded-control hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      loading="eager"
                      width={28}
                      height={28}
                      src={`https://authjs.dev/img/providers/${provider.id}.svg`}
                      alt="Hazlo Sano"
                      className="h-7 w-7"
                    />
                    <span className="text-label font-medium text-text-support">
                      {t("signInWith")}{" "}
                      {provider.id === "microsoft-entra-id"
                        ? "Microsoft"
                        : provider.name}
                    </span>
                  </div>
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className="h-5 w-5 text-pw-green"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
          </div>

          <div className="text-xs text-text-muted">{t("terms")}</div>
        </div>
      </div>
    </section>
  );
}

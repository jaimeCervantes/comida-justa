"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import Image from "next/image";

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getProviders().then((p) => setProviders(p));
  }, []);

  return (
    <div className="w-full max-w-lg flex items-center justify-center align-items-center mx-auto">
      <div className="mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/6 overflow-hidden">
        <div className="p-8 md:p-10 flex flex-col items-center text-center">
          <div className="h-40 bg-white flex items-center justify-center mb-4">
            <Image
              loading="eager"
              src="/logo.webp"
              alt="Logo"
              className="h-40"
              width={100}
              height={100}
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-prose">
            Accede para publicar, comentar y participar en la comunidad. Elige
            un proveedor para iniciar sesión.
          </p>

          <div className="w-full mt-6 space-y-3">
            {providers &&
              Object.values(providers).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => signIn(provider.id)}
                  aria-label={`Sign in with ${provider.name}`}
                  className="w-full flex items-center justify-between gap-3 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-pw-lightgreen/40"
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
                    <span className="text-sm font-medium text-pw-gray dark:text-pw-white">
                      Iniciar sesión con{" "}
                      {provider.id === "microsoft-entra-id"
                        ? "Microsoft"
                        : provider.name}
                    </span>
                  </div>
                  <svg
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

          <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            Al continuar aceptas nuestros términos y la política de privacidad.
          </div>
        </div>
      </div>
    </div>
  );
}

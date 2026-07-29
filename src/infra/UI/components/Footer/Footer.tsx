import Image from "next/image";
import Link from "next/link";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800/60 pt-16 pb-8 mt-16">
      <div className="container-width grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">
        {/* Brand & Pillars */}
        <div className="md:col-span-2 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-bold"
          >
            <Image
              src="/logo.webp"
              alt={`Logo ${PUBLIC_BRAND_NAME}`}
              width={40}
              height={40}
            />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-(--highlight) to-green-600">
              {PUBLIC_BRAND_NAME}
            </span>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
            No somos solo una aplicación, somos todo un ecosistema de
            iniciativas diseñadas para que vivir sano sea la opción más fácil
            para todos.
          </p>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
              Nuestros 4 Pilares
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-(--highlight)">✓</span> Sueño y
                descanso
              </li>
              <li className="flex items-center gap-2">
                <span className="text-(--highlight)">✓</span> Alimentación
                natural y nutritiva
              </li>
              <li className="flex items-center gap-2">
                <span className="text-(--highlight)">✓</span> Movimiento o
                ejercicio
              </li>
              <li className="flex items-center gap-2">
                <span className="text-(--highlight)">✓</span> Emociones /
                mente / espíritu
              </li>
            </ul>
          </div>
        </div>

        {/* Explore & Links */}
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
            Explora
          </h4>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <Link
                href="/publicar"
                className="hover:text-(--highlight) transition-colors inline-block font-medium"
              >
                Publicar un producto o info sana
              </Link>
            </li>
            <li>
              <Link
                href="/nosotros"
                className="hover:text-(--highlight) transition-colors inline-block font-medium"
              >
                Qué es {PUBLIC_BRAND_NAME}
              </Link>
            </li>
            <li>
              <a
                href="https://hazlosano.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--highlight) transition-colors inline-block"
              >
                Comunidad Hazlo Sano
              </a>
            </li>
            <li>
              <a
                href="https://restaurante.hazlosano.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--highlight) transition-colors inline-block"
              >
                Restaurante
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
            Conecta
          </h4>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <a
                href="https://t.me/HazloSanoBot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition-colors flex items-center gap-2"
              >
                🤖 Asistente (Telegram)
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/522781126948"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-500 transition-colors flex items-center gap-2"
              >
                📱 WhatsApp Directo
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/@hazlosano"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                🎵 TikTok
              </a>
            </li>
            <li>
              <a
                href="https://fb.com/hazlo.sano.comunidad"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                🔵 Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-width border-t border-gray-100 dark:border-gray-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
        <p>
          © {currentYear} {PUBLIC_BRAND_NAME}. Todos los derechos reservados.
        </p>
        <p>Ama y cuida tu recurso máximo no renovable, tu tiempo.</p>
      </div>
    </footer>
  );
}

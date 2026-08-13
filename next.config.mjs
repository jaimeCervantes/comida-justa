import createNextIntlPlugin from "next-intl/plugin";

const nextIntlPlugin = createNextIntlPlugin();
const isDevelopment = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_LOGIN_PATH: process.env.NEXT_PUBLIC_LOGIN_PATH,
  },
  images: {
    /*
     * Treinta días de caché para la imagen ya optimizada.
     *
     * El valor por defecto es de minutos, y con él el servidor vuelve a descargar el original de
     * Cloud Storage y a reoptimizarlo una y otra vez: es el "tarda en reflejarse" de la segunda
     * visita, cuando la imagen ya se había visto. Aquí es seguro estirarlo porque **estas URL no
     * cambian de contenido**: el nombre del archivo lleva marca de tiempo y un discriminante (ver
     * `useStorageUpload`), así que editar una publicación produce una URL nueva en vez de pisar la
     * anterior. Nunca se sirve una imagen vieja por esto.
     */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      // Imágenes del catálogo que administra el backend del chatbot; sin este host,
      // `next/image` lanza "hostname not configured" y la tarjeta no renderiza.
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // `/info` se renombró a `/nosotros`. El 308 conserva los enlaces externos y lo ya indexado.
  // Se cubre también la variante con prefijo de locale porque next-intl sirve `/es/...` y `/en/...`.
  async redirects() {
    return [
      {
        source: "/info",
        destination: "/nosotros",
        permanent: true,
      },
      {
        source: "/:locale(es|en)/info",
        destination: "/:locale/nosotros",
        permanent: true,
      },
    ];
  },
};

// Allow live reloading on docker development
// @TODO: probar watchOptions sin webpack en docker, aún no pruebo turbopack en docker con live reloading
if (isDevelopment) {
  nextConfig.webpack = (config, _) => ({
    ...config,
    watchOptions: {
      ...config.watchOptions,
      poll: 800,
      aggregateTimeout: 300,
    },
  });
}

export default nextIntlPlugin(nextConfig);

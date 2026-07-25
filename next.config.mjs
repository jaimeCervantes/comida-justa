import createNextIntlPlugin from "next-intl/plugin";

const nextIntlPlugin = createNextIntlPlugin();
const isDevelopment = process.env.NODE_ENV === "development" ? true : false;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_LOGIN_PATH: process.env.NEXT_PUBLIC_LOGIN_PATH,
  },
  images: {
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

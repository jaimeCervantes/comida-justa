/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === "development" ? true : false;

const nextConfig = {
  output: "standalone",
};

// Allow live reloading on docker development
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

export default nextConfig;

const isDevelopment = process.env.NODE_ENV === "development" ? true : false;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { defaultLoaders }) => {
    config.module.rules.push({
      test: /node_modules\/sidepix\/.*\.js$/,
      use: defaultLoaders.babel,
    });

    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */

// Hosts de imágenes remotas permitidos (dominio exacto y subdominios con "**.")
const imageHosts = [
  "discogs.com",
  "**.discogs.com",
  "gravatar.com",
  "**.gravatar.com",
  "**.scdn.co",
  "**.fastly.net",
  "images.unsplash.com",
  "oaidalleapiprodscus.blob.core.windows.net",
  "pollinations.ai",
  "**.pollinations.ai",
];

const nextConfig = {
  experimental: {
    // Con app/ presente (ruta del chat), las URL inexistentes las sirve el App
    // Router: app/global-not-found.tsx da la 404 propia (pages/404.tsx no llega)
    globalNotFound: true,
  },
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

module.exports = nextConfig;

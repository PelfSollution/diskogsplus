/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "st.discogs.com",
      "i.discogs.com",
      "img.discogs.com",
      "api.discogs.com",
      "secure.gravatar.com",
      "gravatar.com",
      "www.gravatar.com",
      "i.scdn.co",
      "lastfm.freetls.fastly.net",
      "images.unsplash.com",
      "oaidalleapiprodscus.blob.core.windows.net",
      "image.pollinations.ai",
      "pollinations.ai",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.discogs.com",
      },
      {
        protocol: "https",
        hostname: "**.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "**.scdn.co",
      },
      {
        protocol: "https",
        hostname: "**.fastly.net",
      },
      {
        protocol: "https",
        hostname: "**.pollinations.ai",
      },
    ],
  },
};

module.exports = nextConfig;
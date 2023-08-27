This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## DiscogsPlus

* [.next/](./diskogsplus/.next)
  * [cache/](./diskogsplus/.next/cache)
  * [server/](./diskogsplus/.next/server)
  * [static/](./diskogsplus/.next/static)
  * [build-manifest.json](./diskogsplus/.next/build-manifest.json)
  * [package.json](./diskogsplus/.next/package.json)
  * [react-loadable-manifest.json](./diskogsplus/.next/react-loadable-manifest.json)
  * [trace](./diskogsplus/.next/trace)
* [components/](./diskogsplus/components)
  * [ui/](./diskogsplus/components/ui)
  * [Layout.tsx](./diskogsplus/components/Layout.tsx)
  * [TopNavBar.tsx](./diskogsplus/components/TopNavBar.tsx)
* [convex/](./diskogsplus/convex)
  * [_generated/](./diskogsplus/convex/_generated)
  * [.schema.ts](./diskogsplus/convex/.schema.ts)
  * [README.md](./diskogsplus/convex/README.md)
  * [addUser.ts](./diskogsplus/convex/addUser.ts)
  * [mixtapes.ts](./diskogsplus/convex/mixtapes.ts)
  * [tsconfig.json](./diskogsplus/convex/tsconfig.json)
  * [user.ts](./diskogsplus/convex/user.ts)
* [hooks/](./diskogsplus/hooks)
  * [useGetAlbumData.ts](./diskogsplus/hooks/useGetAlbumData.ts)
  * [useGetAlbumInfo.ts](./diskogsplus/hooks/useGetAlbumInfo.ts)
  * [useGetAlbumList.ts](./diskogsplus/hooks/useGetAlbumList.ts)
  * [useGetUserData.ts](./diskogsplus/hooks/useGetUserData.ts)
  * [useMixtape.ts](./diskogsplus/hooks/useMixtape.ts)
* [lib/](./diskogsplus/lib)
  * [openaiConfig.ts](./diskogsplus/lib/openaiConfig.ts)
  * [utils.ts](./diskogsplus/lib/utils.ts)
* [pages/](./diskogsplus/pages)
  * [albums/](./diskogsplus/pages/albums)
  * [api/](./diskogsplus/pages/api)
  * [_app.tsx](./diskogsplus/pages/_app.tsx)
  * [_document.tsx](./diskogsplus/pages/_document.tsx)
  * [dashboard.tsx](./diskogsplus/pages/dashboard.tsx)
  * [index.tsx](./diskogsplus/pages/index.tsx)
  * [mixtape.tsx](./diskogsplus/pages/mixtape.tsx)
* [public/](./diskogsplus/public)
  * [diskogs-logo.gif](./diskogsplus/public/diskogs-logo.gif)
  * [favicon.png](./diskogsplus/public/favicon.png)
  * [next.svg](./diskogsplus/public/next.svg)
  * [vercel.svg](./diskogsplus/public/vercel.svg)
* [styles/](./diskogsplus/styles)
  * [globals.css](./diskogsplus/styles/globals.css)
* [.env.local](./diskogsplus/.env.local)
* [.env.local.sample](./diskogsplus/.env.local.sample)
* [.eslintrc.json](./diskogsplus/.eslintrc.json)
* [.gitignore](./diskogsplus/.gitignore)
* [README.md](./diskogsplus/README.md)
* [components.json](./diskogsplus/components.json)
* [next-env.d.ts](./diskogsplus/next-env.d.ts)
* [next.config.js](./diskogsplus/next.config.js)
* [package-lock.json](./diskogsplus/package-lock.json)
* [package.json](./diskogsplus/package.json)
* [postcss.config.js](./diskogsplus/postcss.config.js)
* [sampleData.jsonl](./diskogsplus/sampleData.jsonl)
* [tailwind.config.js](./diskogsplus/tailwind.config.js)
* [tailwind.config.ts](./diskogsplus/tailwind.config.ts)
* [tsconfig.json](./diskogsplus/tsconfig.json)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## DiscogsPlus
```
diskogsplus/
┣ .next/
┃ ┣ cache/
┃ ┣ server/
┃ ┣ static/
┃ ┣ build-manifest.json
┃ ┣ package.json
┃ ┣ react-loadable-manifest.json
┃ ┗ trace
┣ components/
┃ ┣ ui/
┃ ┣ Layout.tsx
┃ ┗ TopNavBar.tsx
┣ convex/
┃ ┣ _generated/
┃ ┣ .schema.ts
┃ ┣ README.md
┃ ┣ addUser.ts
┃ ┣ mixtapes.ts
┃ ┣ tsconfig.json
┃ ┗ user.ts
┣ hooks/
┃ ┣ useGetAlbumData.ts
┃ ┣ useGetAlbumInfo.ts
┃ ┣ useGetAlbumList.ts
┃ ┣ useGetUserData.ts
┃ ┗ useMixtape.ts
┣ lib/
┃ ┣ openaiConfig.ts
┃ ┗ utils.ts
┣ pages/
┃ ┣ albums/
┃ ┣ api/
┃ ┣ _app.tsx
┃ ┣ _document.tsx
┃ ┣ dashboard.tsx
┃ ┣ index.tsx
┃ ┗ mixtape.tsx
┣ public/
┃ ┣ diskogs-logo.gif
┃ ┣ favicon.png
┃ ┣ next.svg
┃ ┗ vercel.svg
┣ styles/
┃ ┗ globals.css
┣ .env.local
┣ .env.local.sample
┣ .eslintrc.json
┣ .gitignore
┣ README.md
┣ components.json
┣ next-env.d.ts
┣ next.config.js
┣ package-lock.json
┣ package.json
┣ postcss.config.js
┣ sampleData.jsonl
┣ tailwind.config.js
┣ tailwind.config.ts
┗ tsconfig.json
```

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

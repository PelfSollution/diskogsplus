import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ConvexProvider, ConvexReactClient } from "convex/react";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL no está definido en las variables de entorno.");
}
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

function MyApp({ Component, pageProps }: AppProps) {
  return (
  <ConvexProvider client={convex}>
  <Component {...pageProps} />
  </ConvexProvider>
  );
}

export default MyApp

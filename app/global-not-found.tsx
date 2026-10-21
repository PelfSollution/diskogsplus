// 404 de las URL que no existen (docs/design.md §5, «Estados vacíos y errores»).
// No pasa por pages/_app ni por el Layout: lleva sus propios estilos y fuentes.
import "../styles/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import type { Metadata } from "next";
import VinylDisc from "@/components/VinylDisc";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Este surco no existe | Diskogs+",
  description: "La página que buscas no está en la colección.",
};

export default function GlobalNotFound() {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body className="tw-font-sans tw-bg-white tw-text-gray-900">
        <main className="tw-min-h-screen tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-gap-5 tw-px-4">
          <VinylDisc size={120} />
          <div>
            <p className="tw-font-mono tw-text-sm tw-font-semibold tw-text-brand-700">404</p>
            <h1 className="tw-text-3xl tw-font-bold tw-tracking-tight tw-mt-1">Este surco no existe</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-2 tw-max-w-sm">
              La página que buscas no está en la colección. Puede que el enlace esté mal o que se haya movido.
            </p>
          </div>
          <Link
            href="/"
            className="tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold tw-flex tw-items-center"
          >
            Volver al inicio
          </Link>
        </main>
      </body>
    </html>
  );
}

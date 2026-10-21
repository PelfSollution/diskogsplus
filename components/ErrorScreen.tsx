import React from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import VinylDisc from "@/components/VinylDisc";

type ErrorScreenProps = {
  code: number | string;
  title: string;
  message: string;
};

/** Pantalla de error (404 y otros): un vinilo parado y vuelta al inicio. */
export default function ErrorScreen({ code, title, message }: ErrorScreenProps) {
  return (
    <Layout centeredContent={true} allowPublicAccess={true} title={`${title} | Diskogs+`} description={message}>
      <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-5 tw-px-4">
        <VinylDisc size={120} />
        <div>
          <p className="tw-font-mono tw-text-sm tw-font-semibold tw-text-brand-700">{code}</p>
          <h1 className="tw-text-3xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">{title}</h1>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2 tw-max-w-sm">{message}</p>
        </div>
        <Link
          href="/"
          className="tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold tw-flex tw-items-center"
        >
          Volver al inicio
        </Link>
      </div>
    </Layout>
  );
}

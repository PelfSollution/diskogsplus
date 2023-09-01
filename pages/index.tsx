import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Si la cookie existe, redirige al dashboard
    if (getCookie("username")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <Layout allowPublicAccess={true}>
      <header className="tw-text-center tw-mb-8">
        <Image
          src="/diskogs-logo.gif"
          alt="Diskogs plus"
          className="tw-w-full tw-max-w-full"
          width={500}
          height={149}
        />
        <p className="tw-text-xl tw-mt-2">Descripción de la app</p>
      </header>

      {/* si el usuario está loggeado, no mostrará el botón de inicio de sesión.
       */}
      <div className="tw-flex tw-flex-col">
        <Button
          onClick={() => router.push("/api/auth/authorize")}
          className="tw-self-center mx-auto block"
        >
          Hacer Login con Discogs
        </Button>
      </div>
    </Layout>
  );
}

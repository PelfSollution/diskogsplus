import { useEffect } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import Image from "next/image";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();

  useEffect(() => {

    if (getCookie("username")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <Layout
      title="Inicio - Diskogs +"
      description="Inicia sesión en Diskogs +"
      allowPublicAccess={true}
    >
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
        <header className="tw-text-center tw-max-w-xl mx-auto">
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
            <Image
              src="/diskogs-logo.gif"
              alt="Diskogs plus"
              className="tw-w-auto tw-max-w-md mx-auto block"
              width={500}
              height={149}
            />
         <p className="tw-text-xl tw-mt-2">Conecta tu cuenta de <a href="https://discogs.com/" target="_blank" rel="noopener noreferrer" className="tw-text-blue-500 tw-hover:underline">
                Discogs
            </a> y sumérgete en tu colección de vinilos de una manera enriquecida con <strong>Diskogs Plus</strong>.</p>

          </div>
        </header>

        <div className="tw-flex tw-flex-col tw-mt-8">
          <Button
            variant="outline"
            size={"sm"}
            onClick={() => router.push("/api/auth/authorize")}
            className="tw-opacity-100 hover:tw-opacity-70 tw-self-center mx-auto block"
          >
            Hacer Login con Discogs
          </Button>
        </div>
      </div>
    </Layout>
  );
}

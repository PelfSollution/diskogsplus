import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import Image from "next/image";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [devUser, setDevUser] = useState("");
  const [isDevLoading, setIsDevLoading] = useState(false);

  useEffect(() => {
    if (getCookie("username")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devUser.trim()) return;
    setIsDevLoading(true);
    try {
      const res = await fetch("/api/auth/devLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: devUser.trim() }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Error al iniciar sesión en modo dev.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con devLogin");
    } finally {
      setIsDevLoading(false);
    }
  };

  return (
    <Layout
      title="Inicio - Diskogs +"
      description="Inicia sesión en Diskogs +"
      allowPublicAccess={true}
    >
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-py-8">
        <header className="tw-text-center tw-max-w-xl tw-mx-auto">
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/diskogs-logo.gif"
              alt="Diskogs plus"
              className="tw-w-auto tw-max-w-md tw-mx-auto tw-block"
              width={500}
              height={149}
            />
            <p className="tw-text-lg md:tw-text-xl tw-mt-3 tw-text-gray-700 dark:tw-text-gray-300">
              Conecta tu cuenta de{" "}
              <a
                href="https://discogs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="tw-text-blue-500 hover:tw-underline tw-font-semibold"
              >
                Discogs
              </a>{" "}
              y sumérgete en tu colección de vinilos con asistencia de IA y mezcla DJ armónica.
            </p>
          </div>
        </header>

        {/* Acceso Principal con Discogs OAuth */}
        <div className="tw-flex tw-flex-col tw-items-center tw-mt-6 tw-w-full tw-max-w-sm">
          <Button
            variant="outline"
            size={"lg"}
            onClick={() => router.push("/api/auth/authorize")}
            className="tw-w-full tw-font-bold tw-text-base tw-py-3 tw-border-blue-400 tw-text-blue-600 hover:tw-bg-blue-50 dark:hover:tw-bg-blue-950/40 tw-shadow-sm"
          >
            Hacer Login con Discogs (OAuth)
          </Button>

          {/* Modo de Acceso Rápido / Desarrollo */}
          <div className="tw-w-full tw-mt-8 tw-p-4 tw-rounded-2xl tw-border tw-border-dashed tw-border-gray-300 dark:tw-border-gray-700 tw-bg-gray-50/60 dark:tw-bg-gray-800/40">
            <div className="tw-text-xs tw-font-bold tw-text-gray-500 dark:tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">
              🛠️ Modo Desarrollo / Acceso Directo
            </div>
            <p className="tw-text-xs tw-text-gray-600 dark:tw-text-gray-300 tw-mb-3">
              ¿No tienes aún tus claves de Discogs API? Introduce tu usuario de Discogs para entrar directamente:
            </p>
            <form onSubmit={handleDevLogin} className="tw-flex tw-gap-2">
              <input
                type="text"
                value={devUser}
                onChange={(e) => setDevUser(e.target.value)}
                placeholder="Tu usuario de Discogs..."
                className="tw-flex-1 tw-text-xs tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-gray-300 dark:tw-border-gray-600 tw-bg-white dark:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-white tw-outline-none"
              />
              <button
                type="submit"
                disabled={isDevLoading || !devUser.trim()}
                className="tw-text-xs tw-font-medium tw-px-3 tw-py-2 tw-rounded-lg tw-bg-gray-800 dark:tw-bg-gray-600 hover:tw-bg-black tw-text-white tw-transition-colors disabled:tw-opacity-50"
              >
                {isDevLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

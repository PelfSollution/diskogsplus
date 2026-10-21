import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import Layout from "@/components/Layout";
import VinylDisc from "@/components/VinylDisc";
import { Disc3, ListMusic, Bot } from "lucide-react";

const FEATURES = [
  { icon: Disc3, text: "BPM, tonalidad Camelot y cara de cada pista de tus discos" },
  { icon: ListMusic, text: "Mixtapes ordenadas por armonía, con avisos de mismo disco" },
  { icon: Bot, text: "DiscBOT: pídele una sesión de 1 h con tus vinilos de soul" },
];

export default function Home() {
  const router = useRouter();
  const [devUser, setDevUser] = useState("");
  const [isDevLoading, setIsDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  useEffect(() => {
    if (getCookie("username")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devUser.trim()) return;
    setIsDevLoading(true);
    setDevError(null);
    try {
      const res = await fetch("/api/auth/devLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: devUser.trim() }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setDevError("No se pudo entrar en modo desarrollo.");
      }
    } catch (err) {
      console.error(err);
      setDevError("No se pudo conectar con el servidor.");
    } finally {
      setIsDevLoading(false);
    }
  };

  return (
    <Layout title="Diskogs+ · Tu colección de vinilos, lista para pinchar" description="Inicia sesión en Diskogs+ con tu cuenta de Discogs" allowPublicAccess={true}>
      <div className="tw-max-w-6xl tw-mx-auto tw-px-6 md:tw-px-10 tw-py-12 tw-flex tw-flex-wrap-reverse tw-items-center tw-justify-between tw-gap-12">
        <div className="tw-flex-1 tw-basis-96 tw-flex tw-flex-col tw-gap-6">
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <VinylDisc size={32} flat />
            <span className="tw-text-xl tw-font-bold tw-tracking-tight">
              Diskogs<span className="tw-text-brand-600">+</span>
            </span>
          </div>
          <h1 className="tw-text-4xl md:tw-text-5xl tw-font-bold tw-tracking-tight tw-leading-[1.05] tw-text-gray-900">
            Tu colección de vinilos, lista para pinchar.
          </h1>
          <p className="tw-text-lg tw-text-gray-600 tw-max-w-lg">
            Conecta tu cuenta de Discogs y prepara sesiones con tus propios discos: armonía, BPM y caras, todo en un sitio.
          </p>
          <ul className="tw-flex tw-flex-col tw-gap-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="tw-flex tw-items-center tw-gap-3 tw-text-[15px] tw-text-gray-700">
                <Icon className="tw-w-5 tw-h-5 tw-text-brand-600 tw-shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <div>
            <button
              type="button"
              onClick={() => router.push("/api/auth/authorize")}
              className="tw-h-12 tw-px-6 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-base tw-font-semibold tw-transition-colors"
            >
              Entrar con Discogs
            </button>
          </div>

          {/* Acceso de desarrollo (devLogin): solo en local, en producción da 403 */}
          {process.env.NODE_ENV !== "production" && (
            <form onSubmit={handleDevLogin} className="tw-flex tw-flex-col tw-gap-2 tw-max-w-md tw-p-4 tw-rounded-xl tw-border tw-border-dashed tw-border-gray-300 tw-bg-gray-50">
              <label htmlFor="dev-user" className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-gray-500">
                Desarrollo · entrar sin OAuth
              </label>
              <div className="tw-flex tw-gap-2">
                <input
                  id="dev-user"
                  type="text"
                  value={devUser}
                  onChange={(e) => setDevUser(e.target.value)}
                  placeholder="Usuario de Discogs"
                  className="tw-flex-1 tw-h-10 tw-px-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-outline-none focus:tw-border-brand-600"
                />
                <button
                  type="submit"
                  disabled={isDevLoading || !devUser.trim()}
                  className="tw-h-10 tw-px-4 tw-rounded-lg tw-bg-gray-900 hover:tw-bg-gray-800 tw-text-white tw-text-sm tw-font-medium disabled:tw-opacity-50"
                >
                  {isDevLoading ? "Entrando…" : "Entrar"}
                </button>
              </div>
              {devError && <p className="tw-text-xs tw-text-red-600">{devError}</p>}
            </form>
          )}
        </div>

        <div className="tw-flex-1 tw-basis-72 tw-max-w-[440px] tw-mx-auto">
          <VinylDisc size="fill" spinning />
        </div>
      </div>
    </Layout>
  );
}

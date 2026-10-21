import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Plus, Check, X } from "lucide-react";
import Layout from "@/components/Layout";
import VinylDisc from "@/components/VinylDisc";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetUserData from "@/hooks/useGetUserData";
import useMixtapes from "@/hooks/useMixtapes";
import { createMixtape } from "@/services/client/mixtape";
import { formatSessionDuration } from "@/lib/vinyl";

/** Todas las mixtapes del usuario como vinilos con el mosaico de sus portadas. */
export default function Mixtapes() {
  const router = useRouter();
  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username || "";
  const mixtapes = useMixtapes(username);

  // «+» de la barra lateral: /mixtapes?nueva=1 abre el formulario
  const [isCreating, setIsCreating] = useState(false);
  const showForm = isCreating || router.query.nueva === "1";
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const closeForm = () => {
    setIsCreating(false);
    setName("");
    if (router.query.nueva) router.replace("/mixtapes", undefined, { shallow: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = name.trim();
    if (!nombre || busy) return;
    setBusy(true);
    try {
      const result = await createMixtape(nombre);
      if (typeof result === "string") {
        setMessage(result);
        return;
      }
      mixtapes.setActiveId(result.id);
      router.push(`/mixtape?id=${result.id}`);
    } finally {
      setBusy(false);
    }
  };

  const isLoading = Boolean(username) && mixtapes.isLoading;

  return (
    <Layout centeredTopContent={true} title="Mixtapes | Diskogs+" description="Tus sesiones de vinilo">
      <div className="tw-max-w-6xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 md:tw-py-10 tw-flex tw-flex-col tw-gap-8">
        <header className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
          <div>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">Mixtapes</span>
            <h1 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">Tus sesiones</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              {mixtapes.mixtapes
                ? mixtapes.mixtapes.length === 1
                  ? "1 mixtape"
                  : `${mixtapes.mixtapes.length} mixtapes`
                : mixtapes.isLocal
                ? "Lista guardada en este navegador"
                : "Cargando…"}
            </p>
          </div>
          {mixtapes.mixtapes && !showForm && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold"
            >
              <Plus className="tw-w-4 tw-h-4" />
              Nueva mixtape
            </button>
          )}
        </header>

        {showForm && (
          <form onSubmit={handleCreate} className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-max-w-lg">
            <input
              autoFocus
              type="text"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && closeForm()}
              placeholder="Sesión jazz-funk sábado"
              aria-label="Nombre de la nueva mixtape"
              className="tw-flex-1 tw-min-w-0 tw-h-11 tw-px-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-outline-none focus:tw-border-brand-600 focus:tw-ring-2 focus:tw-ring-brand-600/20"
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="tw-flex tw-items-center tw-gap-1.5 tw-h-11 tw-px-4 tw-rounded-lg tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold"
            >
              <Check className="tw-w-4 tw-h-4" />
              Crear
            </button>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Cancelar"
              className="tw-w-11 tw-h-11 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-gray-500 hover:tw-bg-gray-100"
            >
              <X className="tw-w-4 tw-h-4" />
            </button>
          </form>
        )}

        {isLoading ? (
          <div className="tw-flex tw-justify-center tw-py-16">
            <CustomCircularProgress />
          </div>
        ) : mixtapes.isLocal ? (
          // Sin Supabase: una sola lista en el navegador
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-x-8 tw-gap-y-10">
            <Link href="/mixtape" className="tw-group tw-flex tw-flex-col tw-gap-3">
              <VinylDisc size="fill" className="group-hover:tw-rotate-12 tw-transition-transform tw-duration-500" />
              <span className="tw-text-sm tw-font-semibold tw-text-gray-900">Mi mixtape</span>
            </Link>
          </div>
        ) : (
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-x-8 tw-gap-y-10">
            {(mixtapes.mixtapes || []).map((m) => (
              <Link
                key={m.id}
                href={`/mixtape?id=${m.id}`}
                onClick={() => mixtapes.setActiveId(m.id)}
                className="tw-group tw-flex tw-flex-col tw-gap-3"
              >
                <VinylDisc
                  size="fill"
                  covers={m.portadas}
                  className="group-hover:tw-rotate-12 tw-transition-transform tw-duration-500"
                />
                <span className="tw-min-w-0">
                  <span className="tw-block tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate group-hover:tw-underline">
                    {m.nombre}
                  </span>
                  <span className="tw-block tw-text-[13px] tw-text-gray-500">
                    {m.pistas === 1 ? "1 pista" : `${m.pistas} pistas`}
                    {m.segundos > 0 && ` · ${formatSessionDuration(m.segundos)}`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CustomSnackbar isOpen={Boolean(message)} message={message || ""} onClose={() => setMessage(null)} />
    </Layout>
  );
}

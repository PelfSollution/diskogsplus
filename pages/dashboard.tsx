import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import VinylDisc from "@/components/VinylDisc";
import useMixtapes from "@/hooks/useMixtapes";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetUserData from "@/hooks/useGetUserData";
import { deleteApiKey, getChatAlbums, getWantlist } from "@/services/client/userData";
import format from "date-fns/format";
import { ChatLog, WantlistEntry } from "@/types/types";
import { truncateString } from "@/lib/stringUtils";
import { Key, Disc3, Heart, ListMusic, Bot, ChevronRight, Plus, X, Check, Trash2 } from "lucide-react";

const UserProfile: React.FC<{ data: any }> = ({ data }) => {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [wantlistItems, setWantlistItems] = useState<WantlistEntry[] | null>(null);
  const { data: userData } = useGetUserData();
  const router = useRouter();
  const username = userData?.userProfile?.username;
  const mixtapes = useMixtapes(username || "");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (username) {
          const items = await getWantlist();
          setWantlistItems(items);
          const logs = await getChatAlbums();
          setChatLogs(logs);
          // Verificación de API Key
          const res = await fetch("/api/getApiKey", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
          });

          const resData = await res.json();
          if (resData && (resData.hasApiKey || resData.apiKey)) {
            setHasApiKey(true);
          } else {
            setHasApiKey(false);
          }
        }
      } catch (error) {
        console.error("Error al inicializar datos del dashboard:", error);
      }
    };
    initializeData();
  }, [username]);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSaveApiKey = async () => {
    try {
      const response = await fetch("/api/saveApiKey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, apiKey }),
      });

      if (response.ok) {
        setHasApiKey(true);
        setApiKey("");
      } else {
        console.error("Error al guardar la clave API");
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      if (username) {
        await deleteApiKey();
        setHasApiKey(false);
        setApiKey("");
        handleDialogClose();
      }
    } catch (error) {
      console.error("Error eliminando clave API:", error);
    }
  };

  const handleChatSelection = (index: number) => {
    const selectedChat = chatLogs[index];
    if (selectedChat) {
      router.push(
        `/chat?artista=${encodeURIComponent(
          selectedChat.artista || ""
        )}&album=${encodeURIComponent(
          selectedChat.album || ""
        )}&disco_id=${selectedChat.disco_id}&username=${encodeURIComponent(
          username || ""
        )}`
      );
    }
  };

  const registered = Date.parse(data?.userProfile?.registered)
    ? format(new Date(data?.userProfile?.registered), "dd/MM/yyyy")
    : null;
  const chats = chatLogs.filter((chat) => chat.artista !== null && chat.artista !== undefined);
  const stats = [
    { href: "/albums", label: "discos en tu colección", value: data?.userProfile?.num_collection ?? 0, icon: Disc3 },
    { href: "/wantlist", label: "en tu wantlist", value: wantlistItems ? wantlistItems.length : "–", icon: Heart },
    { href: "/mixtapes", label: "mixtapes", value: mixtapes.mixtapes ? mixtapes.mixtapes.length : "–", icon: ListMusic },
  ];

  return (
    <div className="tw-max-w-6xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 md:tw-py-12 tw-flex tw-flex-col tw-gap-10">
      {/* Saludo con el avatar en la galleta del vinilo */}
      <header className="tw-flex tw-flex-wrap tw-items-center tw-gap-6">
        <VinylDisc size={104} cover={data?.userProfile?.avatar_url || null} />
        <div>
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">Inicio</span>
          <h1 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">
            Hola, {data?.userProfile?.username}
          </h1>
          {registered && <p className="tw-text-sm tw-text-gray-500 tw-mt-1">En Discogs desde el {registered}</p>}
        </div>
      </header>

      {/* Cifras */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-3">
        {stats.map(({ href, label, value, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="tw-group tw-flex tw-items-center tw-gap-4 tw-p-5 tw-rounded-2xl tw-border tw-border-gray-200 hover:tw-border-gray-300 hover:tw-bg-gray-50 tw-transition-colors"
          >
            <span className="tw-w-11 tw-h-11 tw-rounded-xl tw-bg-brand-50 tw-text-brand-700 tw-flex tw-items-center tw-justify-center">
              <Icon className="tw-w-5 tw-h-5" />
            </span>
            <span className="tw-flex-1">
              <span className="tw-block tw-text-2xl tw-font-bold tw-tabular-nums tw-text-gray-900">{value}</span>
              <span className="tw-block tw-text-sm tw-text-gray-500">{label}</span>
            </span>
            <ChevronRight className="tw-w-4 tw-h-4 tw-text-gray-400 group-hover:tw-text-gray-700" />
          </Link>
        ))}
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-10">
        {/* Mixtapes */}
        <section className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
            <h2 className="tw-text-lg tw-font-bold tw-text-gray-900">
              <Link href="/mixtapes" className="hover:tw-underline">Tus mixtapes</Link>
            </h2>
            <Link href="/mixtapes?nueva=1" className="tw-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-text-brand-700 hover:tw-text-brand-800">
              <Plus className="tw-w-4 tw-h-4" />
              Nueva
            </Link>
          </div>
          {mixtapes.mixtapes && mixtapes.mixtapes.length > 0 ? (
            <ul className="tw-flex tw-flex-col">
              {mixtapes.mixtapes.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/mixtape?id=${m.id}`}
                    className="tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-2.5 tw-rounded-lg hover:tw-bg-gray-50 tw-border-b tw-border-gray-100"
                  >
                    <VinylDisc size={40} flat />
                    <span className="tw-flex-1 tw-min-w-0">
                      <span className="tw-block tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate">{m.nombre}</span>
                      <span className="tw-block tw-text-[13px] tw-text-gray-500">
                        {m.pistas === 1 ? "1 pista" : `${m.pistas} pistas`}
                      </span>
                    </span>
                    <ChevronRight className="tw-w-4 tw-h-4 tw-text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tw-text-sm tw-text-gray-500 tw-px-1">
              Aún no tienes mixtapes. Abre un disco y pulsa «+» en una pista para empezar.
            </p>
          )}
        </section>

        {/* Conversaciones con DiscBOT */}
        <section className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
            <h2 className="tw-text-lg tw-font-bold tw-text-gray-900">Conversaciones con DiscBOT</h2>
          </div>
          {chats.length > 0 ? (
            <ul className="tw-flex tw-flex-col">
              {chats.slice(0, 6).map((chat) => (
                <li key={`${chat.artista}-${chat.album}`}>
                  <button
                    type="button"
                    onClick={() => handleChatSelection(chatLogs.indexOf(chat))}
                    className="tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-2.5 tw-rounded-lg hover:tw-bg-gray-50 tw-border-b tw-border-gray-100 tw-text-left"
                  >
                    <span className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-gray-100 tw-text-gray-600 tw-flex tw-items-center tw-justify-center tw-shrink-0">
                      <Bot className="tw-w-5 tw-h-5" />
                    </span>
                    <span className="tw-flex-1 tw-min-w-0">
                      <span className="tw-block tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate">
                        {truncateString(chat.album, 48)}
                      </span>
                      <span className="tw-block tw-text-[13px] tw-text-gray-500 tw-truncate">{chat.artista}</span>
                    </span>
                    <ChevronRight className="tw-w-4 tw-h-4 tw-text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tw-text-sm tw-text-gray-500 tw-px-1">
              Todavía no has hablado con DiscBOT. Pregúntale desde la ficha de un disco o desde una mixtape.
            </p>
          )}
        </section>
      </div>

      {/* Ajustes: clave de IA */}
      <section className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-p-4 tw-rounded-2xl tw-bg-gray-50 tw-border tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-gap-3">
          <Key className="tw-w-5 tw-h-5 tw-text-gray-500" />
          <div>
            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Clave de IA para DiscBOT</p>
            <p className="tw-text-[13px] tw-text-gray-500">
              {hasApiKey === null ? "Comprobando…" : hasApiKey ? "Usas tu propia clave." : "Usas la clave del sistema."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDialogOpen}
          className="tw-h-9 tw-px-4 tw-rounded-full tw-border tw-border-gray-300 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-900 hover:tw-bg-gray-50"
        >
          {hasApiKey ? "Cambiar clave" : "Usar mi clave"}
        </button>
      </section>

      {/* Modal Nativo Tailwind para Clave API */}
      {isDialogOpen && (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4 tw-bg-black/50 tw-backdrop-blur-xs">
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-6 tw-max-w-md tw-w-full tw-shadow-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-animate-in tw-fade-in tw-zoom-in-95 tw-duration-150">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 dark:tw-text-white tw-flex tw-items-center tw-gap-2">
                <Key className="tw-w-5 tw-h-5 tw-text-brand-500" />
                <span>Configurar Clave de IA</span>
              </h3>
              <button
                type="button"
                onClick={handleDialogClose}
                className="tw-text-gray-400 hover:tw-text-gray-600 dark:hover:tw-text-gray-200"
              >
                <X className="tw-w-5 tw-h-5" />
              </button>
            </div>

            <p className="tw-text-xs tw-text-gray-500 tw-mb-4">
              Introduce tu clave de <strong>Google AI Studio</strong> (Gemini) u OpenAI para usar tus propias cuotas en DiscBOT y análisis musical.
            </p>

            <input
              type="password"
              placeholder={hasApiKey ? "•••••••••••••••••••••••••••••••" : "AIzaSy... o sk-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="tw-w-full tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-brand-500 tw-mb-5"
            />

            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
              {hasApiKey && (
                <button
                  type="button"
                  onClick={handleDeleteApiKey}
                  className="tw-flex tw-items-center tw-gap-1 tw-px-3 tw-py-2 tw-rounded-xl tw-text-xs tw-font-medium tw-text-red-600 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/40 tw-transition-colors"
                >
                  <Trash2 className="tw-w-3.5 tw-h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDialogClose}
                className="tw-px-4 tw-py-2 tw-rounded-xl tw-text-xs tw-font-medium tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 tw-transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (apiKey) handleSaveApiKey();
                  handleDialogClose();
                }}
                disabled={!apiKey}
                className="tw-flex tw-items-center tw-gap-1 tw-px-4 tw-py-2 tw-rounded-xl tw-text-xs tw-font-semibold tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-transition-colors tw-shadow-sm"
              >
                <Check className="tw-w-3.5 tw-h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Dashboard() {
  const { data, error, isLoading } = useGetUserData();
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    if (error) {
      let errorMessage = "Ocurrió un error desconocido.";
      if (error.message.includes("401")) {
        errorMessage = "Error de autenticación. Por favor, vuelve a iniciar sesión.";
      } else if (error.message.includes("404")) {
        errorMessage = "La información solicitada no se encontró.";
      } else if (error.message.includes("429")) {
        errorMessage = "Has realizado demasiadas solicitudes. Espera un momento.";
      }
      setSnackbar({ isOpen: true, message: errorMessage });
    }
  }, [error]);

  return (
    <Layout
      centeredTopContent={true}
      title="Dashboard de Usuario | Diskogs +"
      description="Perfil de usuario y gestión de colección de vinilos"
    >
      {isLoading ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-min-h-[70vh]">
          <CustomCircularProgress />
        </div>
      ) : data ? (
        <UserProfile data={data} />
      ) : null}

      <CustomSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
}

export default Dashboard;

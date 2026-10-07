import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetUserData from "@/hooks/useGetUserData";
import { getChatLogsUser } from "@/services/supabase/getChatLogsUser";
import { getMixtapeURLs } from "@/services/supabase/getMixtapeURLs";
import { getWantlistItemsUser } from "@/services/supabase/getWantlistItemsUser";
import format from "date-fns/format";
import styles from "./dashboard.module.css";
import { ChatLog, WantlistEntry } from "@/types/types";
import { truncateString } from "@/lib/stringUtils";
import { deleteApiKey } from "@/services/supabase/deleteApiKey";
import {
  Key,
  PlusCircle,
  Disc,
  MessageSquare,
  ListMusic,
  Calendar,
  X,
  Check,
  Trash2,
} from "lucide-react";

const UserProfile: React.FC<{ data: any }> = ({ data }) => {
  const [isImageLoaded, setImageLoaded] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [wantlistItems, setWantlistItems] = useState<WantlistEntry[] | null>(null);
  const [loadedMixtapeUrls, setLoadedMixtapeUrls] = useState<string[]>([]);
  const { data: userData } = useGetUserData();
  const router = useRouter();
  const username = userData?.userProfile?.username;
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (username) {
          const items = await getWantlistItemsUser(username);
          setWantlistItems(items);
          const logs = await getChatLogsUser(username);
          setChatLogs(logs);
          const mixtapeUrls = await getMixtapeURLs(username);
          if (Array.isArray(mixtapeUrls)) {
            setLoadedMixtapeUrls(mixtapeUrls.map((u) => u.mixtape_url));
          }
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
        await deleteApiKey(username);
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

  return (
    <div className="tw-bg-white dark:tw-bg-gray-800 tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-max-w-md tw-w-full">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 dark:tw-text-white">
          {data?.userProfile?.username}
        </h2>
        <span className="tw-text-xs tw-bg-amber-100 dark:tw-bg-amber-950/50 tw-text-amber-800 dark:tw-text-amber-300 tw-font-semibold tw-px-2.5 tw-py-1 tw-rounded-full">
          Coleccionista
        </span>
      </div>

      {data?.userProfile?.avatar_url && (
        <div className="tw-relative tw-w-44 tw-h-44 tw-mx-auto tw-my-4 tw-rounded-full tw-overflow-hidden tw-shadow-md tw-border-4 tw-border-gray-100 dark:tw-border-gray-750">
          <Image
            src={data?.userProfile?.avatar_url}
            alt={data?.userProfile?.username}
            fill
            className={`tw-object-cover tw-transition-opacity tw-duration-300 ${
              isImageLoaded ? "tw-opacity-100" : "tw-opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Tarjeta de Estadísticas */}
      <div className="tw-bg-gray-50 dark:tw-bg-gray-750 tw-p-4 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-mt-4 tw-space-y-2">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
          <Calendar className="tw-w-4 tw-h-4" />
          <span>
            {Date.parse(data?.userProfile?.registered)
              ? `Registrado el ${format(new Date(data?.userProfile?.registered), "dd/MM/yyyy")}`
              : "Fecha de registro desconocida"}
          </span>
        </div>
        <p className="tw-text-sm tw-text-gray-700 dark:tw-text-gray-200">
          Tienes{" "}
          <strong className="tw-text-purple-600 dark:tw-text-purple-400">
            {data?.userProfile?.num_collection}
          </strong>{" "}
          discos en tu colección.
        </p>
        <p className="tw-text-sm tw-text-gray-700 dark:tw-text-gray-200">
          Tienes{" "}
          <strong className="tw-text-blue-600 dark:tw-text-blue-400">
            {wantlistItems ? wantlistItems.length : 0}
          </strong>{" "}
          discos en tu Wantlist.
        </p>
      </div>

      {/* Selector de Chats */}
      <div className="tw-mt-4">
        <label className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-gray-600 dark:tw-text-gray-300 tw-mb-1.5">
          <MessageSquare className="tw-w-3.5 tw-h-3.5 tw-text-purple-500" />
          <span>Historial de Chats con DiscBOT:</span>
        </label>
        <select
          onChange={(e) => {
            if (e.target.value !== "") {
              handleChatSelection(Number(e.target.value));
            }
          }}
          defaultValue=""
          className="tw-w-full tw-px-3 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-purple-500"
        >
          <option value="" disabled>
            {chatLogs.length > 0 ? "Seleccionar un chat previo..." : "No hay chats disponibles"}
          </option>
          {chatLogs
            .filter((chat) => chat.artista !== null && chat.artista !== undefined)
            .map((chat, index) => (
              <option key={index} value={index}>
                {chat.artista} - {truncateString(chat.album, 20)}
              </option>
            ))}
        </select>
      </div>

      {/* Selector de Mixtapes */}
      <div className="tw-mt-4">
        <label className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-gray-600 dark:tw-text-gray-300 tw-mb-1.5">
          <ListMusic className="tw-w-3.5 tw-h-3.5 tw-text-amber-500" />
          <span>Tus Mixtapes:</span>
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              router.push(e.target.value);
            }
          }}
          defaultValue=""
          className="tw-w-full tw-px-3 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-amber-500"
        >
          <option value="" disabled>
            Seleccionar reproductor...
          </option>
          <option value="/mixtapeplayer">Tocadiscos Mixtape (YouTube)</option>
          <option value="/mixtape">Gestionar lista de Mixtape</option>
        </select>
      </div>

      {/* Botón Ver Colección */}
      <div className="tw-mt-5">
        <button
          type="button"
          onClick={() => router.push("/albums")}
          className="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-px-4 tw-rounded-xl tw-bg-gray-900 dark:tw-bg-white hover:tw-bg-gray-800 dark:hover:tw-bg-gray-100 tw-text-white dark:tw-text-gray-900 tw-font-semibold tw-text-sm tw-transition-colors tw-shadow-sm"
        >
          <Disc className="tw-w-4 tw-h-4" />
          <span>Ver Colección de Vinilos</span>
        </button>
      </div>

      {/* Barra de Gestión de Clave API */}
      <div className="tw-bg-gray-50 dark:tw-bg-gray-750 tw-p-3 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-mt-4 tw-flex tw-items-center tw-justify-between">
        <button
          type="button"
          onClick={handleDialogOpen}
          className="tw-text-xs tw-font-semibold tw-text-purple-600 dark:tw-text-purple-400 hover:tw-underline tw-flex tw-items-center tw-gap-1.5"
        >
          <Key className="tw-w-3.5 tw-h-3.5" />
          <span>Gestionar API Key (IA)</span>
        </button>
        <span className="tw-text-[11px] tw-font-medium tw-text-gray-500">
          {hasApiKey === null ? "Verificando..." : hasApiKey ? "✓ Clave propia activa" : "✓ Clave del sistema"}
        </span>
      </div>

      {/* Modal Nativo Tailwind para Clave API */}
      {isDialogOpen && (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4 tw-bg-black/50 tw-backdrop-blur-xs">
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-6 tw-max-w-md tw-w-full tw-shadow-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-animate-in tw-fade-in tw-zoom-in-95 tw-duration-150">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 dark:tw-text-white tw-flex tw-items-center tw-gap-2">
                <Key className="tw-w-5 tw-h-5 tw-text-purple-500" />
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
              className="tw-w-full tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-purple-500 tw-mb-5"
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
                className="tw-flex tw-items-center tw-gap-1 tw-px-4 tw-py-2 tw-rounded-xl tw-text-xs tw-font-semibold tw-bg-purple-600 hover:tw-bg-purple-700 disabled:tw-opacity-50 tw-text-white tw-transition-colors tw-shadow-sm"
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
    document.body.classList.add("dashboard");
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
    return () => {
      document.body.classList.remove("dashboard");
    };
  }, [error]);

  return (
    <Layout
      centeredTopContent={true}
      title="Dashboard de Usuario | Diskogs +"
      description="Perfil de usuario y gestión de colección de vinilos"
    >
      <div className="tw-flex tw-justify-center tw-items-center tw-min-h-[70vh] tw-p-4">
        {isLoading ? (
          <CustomCircularProgress />
        ) : data ? (
          <UserProfile data={data} />
        ) : null}
      </div>

      <CustomSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
}

export default Dashboard;

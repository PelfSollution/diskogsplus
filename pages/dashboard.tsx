import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
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

const UserProfile: React.FC<{ data: any }> = ({ data }) => {
  const [isImageLoaded, setImageLoaded] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [wantlistItems, setWantlistItems] = useState<WantlistEntry[] | null>(
    null
  );
  const [loadedMixtapeUrls, setLoadedMixtapeUrls] = useState<string[]>([]);
  const { data: userData } = useGetUserData();
  const router = useRouter();
  const username = userData?.userProfile?.username;

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (username) {
          const items = await getWantlistItemsUser(username);
          setWantlistItems(items);
          const logs = await getChatLogsUser(username);
          setChatLogs(logs);
          const mixtapeUrls = await getMixtapeURLs(username);
          setLoadedMixtapeUrls(mixtapeUrls.map((u) => u.mixtape_url));
        }
      } catch (error) {
        console.error(error);
      }
    };

    initializeData();
  }, [username]);

  const handleChatSelection = (value: number) => {
    if (value >= 0 && value < chatLogs.length) {
      const selectedChat = chatLogs[value];
      router.push(
        `/chat?artista=${selectedChat.artista}&album=${selectedChat.album}&username=${username}&disco_id=${selectedChat.disco_id}`
      );
    }
  };

  return (
    <div>
      <h1 className="tw-text-2xl">
        Hola, <span className="tw-font-bold tw-text-blue-500">{username}</span>
      </h1>

      {data.userProfile.avatar_url && (
        <div className="tw-relative tw-mt-4">
          <Image
            src={data.userProfile.avatar_url}
            alt={`${username} profile pic`}
            width={300}
            height={300}
            className={`${styles.spinCustom} tw-rounded-full`}
            onLoad={() => setImageLoaded(true)}
          />
          {isImageLoaded && (
            <>
              <div className="tw-absolute tw-top-1/2 tw-left-1/2 tw-transform tw--translate-x-1/2 tw--translate-y-1/2 tw-w-28 tw-h-28 tw-rounded-full tw-bg-red-400"></div>
              <div className="tw-absolute tw-top-1/2 tw-left-1/2 tw-transform tw--translate-x-1/2 tw--translate-y-1/2 tw-w-6 tw-h-6 tw-rounded-full tw-bg-gray-200"></div>
            </>
          )}
        </div>
      )}

      <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mt-4">
        <Typography variant="body2" color="textSecondary">
          {Date.parse(data.userProfile.registered) ? (
            <p>
              <span className="tw-font-bold">Registrado:</span>{" "}
              {format(
                new Date(data.userProfile.registered),
                "dd/MM/yyyy HH:mm"
              )}
            </p>
          ) : (
            <p className="tw-mt-4">
              <span className="tw-font-bold">Registrado:</span> Fecha
              desconocida
            </p>
          )}
          <p className="tw-mt-2">
            Tu tienes{" "}
            <span className="tw-font-bold tw-text-blue-500">
              {data.userProfile.num_collection}
            </span>{" "}
            discos en tu colecci&oacute;n.
          </p>
          <p>
            Tienes{" "}
            <span className="tw-font-bold tw-text-blue-500">
              {wantlistItems ? wantlistItems.length : 0}
            </span>{" "}
            discos en tu wantlist.
          </p>
        </Typography>
      </div>
      <div className="tw-mt-4">
        <FormControl
          variant="outlined"
          size="small"
          className="tw-mt-4 md:tw-mt-0"
        >
          <InputLabel id="chat-label">Tus ChatsLogs:</InputLabel>
          <Select
            size="small"
            labelId="chat-label"
            onChange={(e) => handleChatSelection(e.target.value as number)}
            label="Tus ChatsLogs:"
            className="tw-min-w-[300px]"
          >
            {chatLogs.length > 0 ? (
              chatLogs
                .filter(
                  (chat) => chat.artista !== null && chat.artista !== undefined
                )
                .map((chat, index) => (
                  <MenuItem key={index} value={index}>
                    {chat.artista} - {chat.album}
                  </MenuItem>
                ))
            ) : (
              <MenuItem value="">
                <em>No hay chats disponibles</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </div>
      <div className="tw-mt-4">
        {/* Selector (solo se muestra si hay loadedMixtapeUrls) */}

        <FormControl
          variant="outlined"
          size="small"
          className="tw-mt-4 md:tw-mt-0"
        >
          <InputLabel id="mixtape-label">Tus Mixtapes:</InputLabel>
          <Select
            labelId="mixtape-label"
            onChange={(e) => {
              const embedUrl = e.target.value as string;
              if (!embedUrl) return;
              const newPath = `/mixtapeplayer?embedUrl=${encodeURIComponent(
                embedUrl
              )}`;
              router.push(newPath);
            }}
            label="Tus Mixtapes:"
            className="tw-min-w-[300px]"
          >
            {loadedMixtapeUrls.length > 0 ? (
              loadedMixtapeUrls.map((url: string, index: number) => (
                <MenuItem key={index} value={url}>
                  {`Mixtape ${index + 1}`}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">
                <em>No hay mixtapes disponibles</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </div>
      <div className="tw-mt-2">
        <Button
          variant="outline"
          size={"sm"}
          onClick={() => router.push("/albums")}
          className="tw-opacity-100 hover:tw-opacity-70 tw-mt-4 tw-self-center"
        >
          Ver tu Colección de Discos
        </Button>
      </div>
    </div>
  );
};

function Dashboard() {
  const { data, error, isLoading, isValidating } = useGetUserData();
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const [message, setMessage] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    document.body.classList.add("dashboard");
    if (error) {
      let errorMessage = "Ocurrió un error desconocido.";

      if (error.message.includes("401")) {
        errorMessage =
          "Error de autenticación. Por favor, vuelve a iniciar sesión.";
      } else if (error.message.includes("404")) {
        errorMessage = "La información solicitada no se encontró.";
      } else if (error.message.includes("429")) {
        errorMessage =
          "Has realizado demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.";
      }

      handleOpenSnackbar(errorMessage);
      setMessage(<CustomCircularProgress />);
    } else if (isLoading) {
      setMessage(<CustomCircularProgress />);
    } else {
      setMessage(null);
    }
    return () => {
      document.body.classList.remove("dashboard");
    };
  }, [message , error, isLoading]);

  const handleOpenSnackbar = (message: string) => {
    setSnackbar({ isOpen: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <Layout
      centeredContent={true}
      title="Dashboard - Diskogs +"
      description="Tu página personal"
    >
      {message ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          {message}
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full">
          <header className="tw-text-center tw-mb-8">
            {data?.userProfile && <UserProfile data={data} />}
          </header>
        </div>
      )}
      <CustomSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        onClose={handleCloseSnackbar}
      />
    </Layout>
  );
}

export default Dashboard;

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { FormControl, InputLabel, MenuItem, Select, Snackbar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";

import useGetUserData from "@/hooks/useGetUserData";
import { getChatLogsUser } from "@/services/supabase/getChatLogsUser";
import { getMixtapeURLs } from "../services/supabase/getMixtapeURLs";

import format from "date-fns/format";
import styles from "./dashboard.module.css";

interface Artist {
  name: string;
}

export interface ChatLog {
  artista: string;
  album: string;
  disco_id: number;
}

interface LoadingOrErrorLayoutProps {
  message: React.ReactNode;
}

const isDateValid = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

const UserProfile: React.FC<{ data: any }> = React.memo(({ data }) => {
  const [isImageLoaded, setImageLoaded] = React.useState(false);
  const [chatLogs, setChatLogs] = React.useState<ChatLog[]>([]);
  const [loadedMixtapeUrls, setLoadedMixtapeUrls] = useState<string[]>([]);
  const [loadingMixtapes, setLoadingMixtapes] = useState(false);
  const { data: userData } = useGetUserData();

  const router = useRouter();

  const loadMixtapes = async () => {
    setLoadingMixtapes(true);
    try {
      const urls = await getMixtapeURLs(userData?.userProfile?.username);
      setLoadedMixtapeUrls(
        urls.map((u: { mixtape_url: string }) => u.mixtape_url)
      );
    } catch (error) {
      console.error("Error al cargar mixtapes:", error);
    } finally {
      setLoadingMixtapes(false);
    }
  };

  const fetchChatLogs = async () => {
    try {
      if (data?.userProfile) {
        const logs = await getChatLogsUser(data.userProfile.username);
        if (logs) {
          setChatLogs(logs);
        }
      }
    } catch (error) {
      console.error("Error al obtener registros del chat:", error);
    }
  };
  

  useEffect(() => {
    if (userData?.userProfile?.username) {
      loadMixtapes();
    }
  }, [userData]);

  React.useEffect(() => {
    fetchChatLogs();
  }, [data]);


  const handleChatSelection = (value: number) => {
    const selectedChat = chatLogs[value];
    router.push(
      `/chat?artista=${selectedChat.artista}&album=${selectedChat.album}&username=${data?.userProfile.username}&disco_id=${selectedChat.disco_id}`
    );
  };

  return (
    <div>
      <h1 className="tw-text-2xl">
        Hola,{" "}
        <span className="tw-font-bold tw-text-blue-500">
          {data.userProfile.username}
        </span>
      </h1>

      {data.userProfile.avatar_url && (
        <div className="tw-relative tw-mt-4">
          <Image
            src={data.userProfile.avatar_url}
            alt={`${data.userProfile.username} profile pic`}
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

      {isDateValid(data.userProfile.registered) ? (
        <p className="tw-mt-4">
          <span className="tw-font-bold">Registrado:</span>{" "}
          {format(new Date(data.userProfile.registered), "dd/MM/yyyy HH:mm")}
        </p>
      ) : (
        <p className="tw-mt-4">
          <span className="tw-font-bold">Registrado:</span> Fecha desconocida
        </p>
      )}

      <p>
        Tu tienes{" "}
        <span className="tw-font-bold tw-text-blue-500">
          {data.userProfile.num_collection}
        </span>{" "}
        discos en tu colecci&oacute;n.
      </p>

      {data.userProfile.favorite_styles && (
        <Stack direction="row" spacing={1}>
          {data.userProfile.favorite_styles
            .split(",")
            .map((style: string, index: number) => (
              <Chip key={index} label={style.trim()} />
            ))}
        </Stack>
      )}
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
        {loadedMixtapeUrls.length > 0 && (
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
              <MenuItem value="">
                <em>Selecciona una mixtape...</em>
              </MenuItem>
              {loadedMixtapeUrls.map((url: string, index: number) => (
                <MenuItem key={index} value={url}>
                  {`Mixtape ${index + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
});

const LoadingOrErrorLayout: React.FC<LoadingOrErrorLayoutProps> = ({
  message,
}) => (
  <Layout centeredContent={true}>
    <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
      {message}
    </div>
  </Layout>
);

function Dashboard() {
  const { data, error, isLoading, isValidating } = useGetUserData();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleOpenSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (error) {
    let errorMessage = "Ocurrió un error desconocido.";
  
    if (error.message.includes("401")) {
      errorMessage = "Error de autenticación. Por favor, vuelve a iniciar sesión.";
    } else if (error.message.includes("404")) {
      errorMessage = "La información solicitada no se encontró.";
    } else if (error.message.includes("429")) {
      errorMessage = "Has realizado demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.";
    } 
  
    handleOpenSnackbar(errorMessage);
  
    return <LoadingOrErrorLayout message={<CustomCircularProgress />} />;
  }
  

  if (isLoading || isValidating) {
    return <LoadingOrErrorLayout message={<CustomCircularProgress />} />;
  }

  return (
    <Layout
      centeredContent={true}
      title="Dashboard - Diskogs +"
      description="Tu página personal"
    >
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full">
        <header className="tw-text-center tw-mb-8">
          {data?.userProfile && <UserProfile data={data} />}
        </header>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={openSnackbar}
        autoHideDuration={3000} // Duración en milisegundos
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon />
          </IconButton>
        }
      />
    </Layout>
  );
}

export default React.memo(Dashboard);

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dialog,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
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
          setLoadedMixtapeUrls(mixtapeUrls.map((u) => u.mixtape_url));
          // Verificación de API Key
          const res = await fetch("/api/getApiKey", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
          });

          const data = await res.json();

          if (data && data.apiKey) {
            setHasApiKey(true);
          } else {
            setHasApiKey(false);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    initializeData();
  }, [username]);

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
        const data = await response.json();
       console.log(data.status);
      } else {
        const errorData = await response.json();
        console.log(`Error al guardar la clave API: ${errorData.error}`);
      }
    } catch (error) {
      console.log("Error al guardar la clave API");
    }
  };

  const handleChatSelection = (value: number) => {
    if (value >= 0 && value < chatLogs.length) {
      const selectedChat = chatLogs[value];
      router.push(
        `/chat?artista=${selectedChat.artista}&album=${selectedChat.album}&username=${username}&disco_id=${selectedChat.disco_id}`
      );
    }
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
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
                    {chat.artista} - {truncateString(chat.album, 16)}
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
      <div className="tw-w-full tw-mt-2">
        <Button
          variant="outline"
          onClick={() => router.push("/albums")}
          className="tw-opacity-100 hover:tw-opacity-70 tw-mt-4 tw-self-center tw-w-full"
        >
          Ver tu Colección de Discos
        </Button>
      </div>

      {/* Link para abrir el modal */}
      <div className="tw-bg-gray-200 tw-p-2 tw-rounded-md tw-mt-4 tw-flex tw-justify-between">

  <Typography variant="body2" color="textSecondary">
    <button
      onClick={handleDialogOpen}
      className="tw-text-blue-500 tw-flex tw-items-center"
    >
      <AddCircleOutlineIcon fontSize="small" className="tw-mr-1" />
      Añadir API Key (OpenAI)
    </button>
  </Typography>
  <Typography variant="body2" color="textSecondary">
  {hasApiKey === null ? (
    <>{"\u00A0"}[Verificando...]</>
  ) : hasApiKey ? (
    <>{"\u00A0"}[API Key propia]</>
  ) : (
    <>{"\u00A0"}[API Key sistema]</>
  )}
</Typography>

</div>


      {/* Modal */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle style={{ marginBottom: "4px", paddingBottom: "4px" }}>
          Añadir API Key (OpenAI)
        </DialogTitle>
        <DialogContent style={{ marginBottom: "0", paddingBottom: "0" }}>
          <TextField
            id="apiKey"
            type="password"
            value={apiKey || ""}
            onChange={(e) => setApiKey(e.target.value)}
            variant="outlined"
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <div className="tw-flex tw-flex-row tw-justify-between tw-items-right tw-gap-2 tw-mr-4">
            <Button
              onClick={() => {
                handleSaveApiKey();
                handleDialogClose();
              }}
              size={"sm"}
              variant="outline"
            >
              Guardar
            </Button>
            <Button onClick={handleDialogClose} variant="outline" size={"sm"}>
              Cancelar
            </Button>
          </div>
        </DialogActions>
      </Dialog>
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
  }, [message, error, isLoading]);

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
      description="Tu página principal [dasboard] de Diskogs +"
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

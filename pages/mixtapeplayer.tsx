import Layout from "@/components/Layout";
import React from "react";
import { useRouter } from "next/router";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { deleteMixtapeURL } from "@/services/supabase/deleteMixtapeURL";


function shareOnTwitter(url: string | string[] | undefined) {
  if (typeof url === "string") {
    window.open(
      `https://twitter.com/intent/tweet?text=Mi%20Mixtape%20%5BDiskogs%20%2B%5D%3A%20${encodeURIComponent(
        url
      )}`,
      "_blank"
    );
  }
}

function shareOnFacebook(url: string | string[] | undefined) {
  if (typeof url === "string") {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  }
}

function shareOnWhatsApp(url: string | string[] | undefined) {
  if (typeof url === "string") {
    window.open(
      `https://api.whatsapp.com/send?text=Mi%20Mixtape%20%5BDiskogs%20%2B%5D%3A%20${encodeURIComponent(
        url
      )}`,
      "_blank"
    );
  }
}

export default function MixtapePlayer() {
  const router = useRouter();
  const { embedUrl } = router.query;

  async function handleDeleteMixtape() {
   // console.log("embedUrl", embedUrl);
    try {
      if (typeof embedUrl === "string") {
        // 1. Obtener el ID de la lista de reproducción de la URL
        const playlistIdMatch = embedUrl.match(/\/playlist\/(\w+)$/);
        if (!playlistIdMatch) {
          throw new Error(
            "No se pudo obtener el ID de la lista de reproducción de la URL"
          );
        }
        const playlistId = playlistIdMatch[1];

        await deleteMixtapeURL(playlistId);

        // 4. Redirige al usuario
        router.push("/mixtape");
      }
    } catch (error) {
      console.error("Error eliminando mixtape:", (error as Error).message);
    }
  }

  return (
    <Layout
      centeredTopContent={true}
      title="Mi Mixtape [Diskogs +] - Diskogs +"
      description="Mixtape Digital con todos los temas de los discos que has añadido"
    >
      <div className="tw-container tw-mx-auto tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center">
          <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mixtape</h1>
          <button
            className="tw-opacity-100 tw-mb-2 hover:tw-opacity-70 tw-text-red-400 tw-border tw-border-red-400 md:tw-px-2 md:tw-py-1 tw-px-1 tw-py-0.5 tw-rounded tw-min-w-[100px]"
            onClick={handleDeleteMixtape} // Aquí
          >
            Borrar Mixtape
          </button>
        </div>
        <div className="w-full max-w-xl">
          {embedUrl ? (
            <iframe
              src={embedUrl as string}
              width="100%"
              height="800"
              frameBorder="0"
              allowTransparency={true}
              allow="encrypted-media"
            ></iframe>
          ) : (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
              <CustomCircularProgress />
            </div>
          )}
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center md:tw-flex-row md:tw-space-x-4">
        <button
          onClick={() => shareOnTwitter(embedUrl)}
          className="tw-mt-2 tw-mb-2 tw-bg-black tw-text-white tw-px-4 tw-py-2 tw-rounded tw-cursor-pointer tw-max-w-[400px]"
        >
          <TwitterIcon className="tw-mr-2" /> Compartir en Twitter
        </button>
        <button
          onClick={() => shareOnFacebook(embedUrl)}
          className="tw-mt-2 tw-mb-2 tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-cursor-pointer tw-max-w-[400px]"
        >
          <FacebookIcon className="tw-mr-2" /> Compartir en Facebook
        </button>
        <button
          onClick={() => shareOnWhatsApp(embedUrl)}
          className="tw-mt-2 tw-mb-2 tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-cursor-pointer tw-max-w-[400px]"
        >
          <WhatsAppIcon className="tw-mr-2" /> Compartir en WhatsApp
        </button>
      </div>
    </Layout>
  );
}

import format from "date-fns/format";
import { useRouter } from "next/router";
import useGetUserData from "@/hooks/useGetUserData";
import Image from "next/image";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

interface UserAlbums {
  releases: Album[];
}

interface Artist {
  name: string;
}

interface Album {
  id: number;
  basic_information: {
    cover_image: string;
    artists: Artist[];
    title: string;
    created_at: string;
  };
}

const isDateValid = (dateString: string): boolean => {
  return !isNaN(Date.parse(dateString));
};

function Dashboard() {
  const router = useRouter();
  const { data, error, isLoading, isValidating } = useGetUserData();
  console.log("Datos obtenidos de useGetUserData:", data);

  return (
    <Layout centeredContent={true} title="Dashboard - Diskogs +" description="Tu página personal">
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full">
        <header className="tw-text-center tw-mb-8">
          <div>
            {error && !isLoading && <div>Error: failed to load</div>}
            {isLoading || (isValidating && <div>Loading...</div>)}

            {data?.userProfile && Object.keys(data).length > 0 ? (
              <div>
                <h1 className="tw-text-2xl">
                  Hola,{" "}
                  <span className="tw-font-bold tw-text-blue-500">
                    {data.userProfile.username}
                  </span>
                </h1>
                {data.userProfile.avatar_url && (
                  <Image
                    src={data.userProfile.avatar_url}
                    alt={`${data.userProfile.username} profile pic`}
                    width={300}
                    height={300}
                    className="tw-mt-4 tw-rounded-full"
                  />
                )}

                {isDateValid(data.userProfile.registered) ? (
                  <p className="tw-mt-4">
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
                <Button
                  onClick={() => router.push("/albums")}
                  className="tw-opacity-100 hover:tw-opacity-70 tw-mt-4 tw-self-center"
                >
                  Ver Vinilos
                </Button>
              </div>
            ) : (
              <p>Inicie sesi&oacute;n para ver su perfil.</p>
            )}
          </div>
        </header>
      </div>
    </Layout>
  );
}

export default Dashboard;

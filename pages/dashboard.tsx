import format from "date-fns/format";
import { useRouter } from "next/router";
import useGetUserData from "@/hooks/useGetUserData";
import Image from "next/image";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { Button } from "@/components/ui/button";
import styles from "./dashboard.module.css";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";


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

  return (
    <Layout
      centeredContent={true}
      title="Dashboard - Diskogs +"
      description="Tu página personal"
    >
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full">
        <header className="tw-text-center tw-mb-8">
          <div>
            {error && !isLoading && (
              <Layout centeredContent={true}>
                <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
                  Error: No se pudo cargar la información.
                </div>
              </Layout>
            )}
            {isLoading ||
              (isValidating && (
                <Layout centeredContent={true}>
                  <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
                    <CustomCircularProgress />
                  </div>
                </Layout>
              ))}

            {data?.userProfile && (
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
                    />
                    <div className="tw-absolute tw-top-1/2 tw-left-1/2 tw-transform tw--translate-x-1/2 tw--translate-y-1/2 tw-w-28 tw-h-28 tw-rounded-full tw-bg-red-400"></div>
                    <div className="tw-absolute tw-top-1/2 tw-left-1/2 tw-transform tw--translate-x-1/2 tw--translate-y-1/2 tw-w-6 tw-h-6 tw-rounded-full tw-bg-gray-200"></div>
                  </div>
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
                <div className="tw-mt-6">
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
            )}
          </div>
        </header>
      </div>
    </Layout>
  );
}

export default Dashboard;

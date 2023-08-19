import useSWR from "swr";

// Defino la función que utilizaré para obtener los datos desde una URL.
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Esta es la estructura de los datos del álbum que espero obtener de la API.
export interface AlbumInfoInterface {
  label: string;
  catalogNo: string;
  rating: number;
  released: string;
  country: string;
  genres: string[];
  styles: string[];
  tracklist: { position: string; title: string; duration: string }[];
}

// Defino la estructura de la respuesta que espero del hook.
export interface AlbumInfoPropsInterface {
  data: {
    albumInfo: AlbumInfoInterface;
  };
  error: boolean | undefined;
  isLoading: boolean | undefined;
  isValidating: boolean | undefined;
}

const useGetAlbumInfo = (id: number, masterId: number) => {
  // Obtengo la información del álbum usando el hook useSWR.
  // Uso el id y masterId para formar la URL que se conectará con la API.
  const { data, error, isLoading, isValidating }: AlbumInfoPropsInterface =
    useSWR(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/albumInfo?id=${id}&masterId=${masterId}`,
      fetcher
    );

  // Devuelvo los datos y algunas propiedades útiles que podré usar en mis componentes.
  return { data, error, isLoading, isValidating };
};

export default useGetAlbumInfo;

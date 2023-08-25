import useSWR from "swr";

// Defino la función que utilizaré para obtener los datos desde una URL.
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Error fetching data');
  }
  return res.json();
});

// Esta es la estructura de los datos del álbum que espero obtener de la API.
export interface TrackType {
  uniqueId: string;  // Este es el identificador único (ID del álbum + título del track)
  position: string;
  title: string;
  duration: string;
  // ... posiblemente otras propiedades
}
export interface AlbumInfoInterface {
  albumId: string;
  coverImage: string;
  backCoverImage: string;
  artist: string;
  title: string;
  label: string;
  catalogNo: string;
  rating: number;
  released: string;
  country: string;
  genres: string[];
  styles: string[];
  tracklist: TrackType[];
  lastfmTags?: string[];
  enrichedInfo?: string;
  spotifyAlbumId?: string; 
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
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/albumInfo?id=${id}`;
  const { data, error, isValidating } = useSWR(url, fetcher);

  // Imprimimos información útil para depuración.
  console.log("Fetching from URL:", url);
  console.log("Data received:", data);
  if (error) console.error("Error fetching album info:", error);

  // Asumimos que si no hay data y no hay error, estamos cargando.
  const isLoading = !data && !error;

  return {
    data: data?.albumInfo, // Aquí accedemos directamente a albumInfo.
    error,
    isLoading,
    isValidating
  };
};

export default useGetAlbumInfo;

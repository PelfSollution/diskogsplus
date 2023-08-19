import useSWRInfinite from 'swr/infinite';
import { KeyedMutator } from 'swr';

export interface AlbumDataInterface {
  // Esta es la estructura de los datos que espero obtener de la API de Discogs.
  // Puedo actualizar esta interfaz con más campos según lo necesite.
  id: number;
  title: string;
  artist: string;
  // ...otros campos que podrían venir de la API.
}

// Función fetcher para realizar la llamada a la API y devolver los datos en formato JSON.
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const useGetAlbumData = () => {
  // Defino cuántos elementos quiero obtener por página.
  const perPage = 20;

  // Uso el hook useSWRInfinite para manejar la paginación y la obtención de datos.
  const {
    data,
    size,
    setSize,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWRInfinite(
    (page) =>
      // Creo la URL para obtener datos, incluyendo el número de página y la cantidad de elementos por página.
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/AlbumData?page=${
        page + 1
      }&per_page=${perPage}`,
    fetcher,
    // Establezco algunas opciones, como validar la primera página y realizar peticiones en paralelo.
    { revalidateFirstPage: true, parallel: true }
  );

  // Devuelvo los datos y algunas funciones y propiedades útiles que puedo utilizar en mis componentes.
  return {
    data,
    isLoading,
    error,
    isValidating,
    size,
    setSize,
    perPage,
    mutate,
    // También proporciono un alias para "mutate" llamado "mutateData" por claridad.
    mutateData: mutate,
  };
};

export default useGetAlbumData;



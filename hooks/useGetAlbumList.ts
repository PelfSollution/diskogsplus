import useSWRInfinite from "swr/infinite";

// Esta es la función que usaré para obtener datos desde una URL.
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const useGetAlbumList = () => {
  // Defino cuántos álbumes quiero recuperar por página.
  const perPage = 50;

  // Aquí uso desestructuración para obtener las propiedades que necesito de useSWRInfinite.
  const {
    data, // Datos cargados.
    error, // Cualquier error que ocurra durante la carga.
    size, // Número actual de páginas cargadas.
    setSize, // Función para establecer cuántas páginas se deben cargar.
    isValidating, // Si se están validando o no los datos en este momento.
  } = useSWRInfinite(
    // Defino cómo generar la URL de cada página.
    (page) =>
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/catalog?page=${
        page + 1
      }&per_page=${perPage}`,
    fetcher,
    {
      revalidateFirstPage: true, // Siempre vuelvo a validar la primera página.
      parallel: false, // No cargo las páginas en paralelo.
    }
  );

  // Si no hay datos y tampoco hay errores, significa que está cargando.
  const isLoading = !data && !error;

  // Devuelvo los datos y algunas propiedades útiles que podré usar en mis componentes.
  return {
    data,
    error,
    isLoading,
    size,
    setSize,
    isValidating,
  };
};

export default useGetAlbumList;

import useSWRInfinite from "swr/infinite";

const fetcher = async (url: string) => {
  console.log("Fetching URL:", url); // <-- Aquí agregamos el log para la URL

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.message}`);
  }

  return response.json();
};

const useCompareAlbumList = (user1: string, user2: string, currentPage: number) => {
  const perPage = 50;

  const getKey = (pageIndex: number, previousPageData: any) => {
    // Si la página anterior es nula, regresa null para detener la paginación
    if (previousPageData && !previousPageData.length) return null;

    // Regresa la URL del API para la página solicitada
    return `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/compare?user1=${user1}&user2=${user2}&page=${currentPage}&per_page=${perPage}`;
  }

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    { revalidateFirstPage: true, parallel: false }
  );

  if (data) {
    console.log("Data received:", data); // <-- Log para los datos
  }

  if (error) {
    console.log("Error:", error); // <-- Log para errores
  }

  const isLoading = !data && !error;

  return { data, error, isLoading, size, setSize, isValidating };
};

export default useCompareAlbumList;

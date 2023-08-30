// hooks/useCompareAlbumList.ts
import useSWRInfinite from "swr/infinite";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const useCompareAlbumList = (user1: string, user2: string) => {
    const perPage = 50;
    const { data, error, size, setSize, isValidating } = useSWRInfinite(
        (page) => `${process.env.NEXT_PUBLIC_BASE_URL}/api/albums/compare?user1=${user1}&user2=${user2}&page=${page + 1}&per_page=${perPage}`,
        fetcher,
        { revalidateFirstPage: true, parallel: false }
    );

    const isLoading = !data && !error;

    return { data, error, isLoading, size, setSize, isValidating };
};

export default useCompareAlbumList;

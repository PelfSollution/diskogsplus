import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Error fetching data");
    }
    return res.json();
  });

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
  tracklist: {
    position: string;
    title: string;
    duration: string;
    spotifyTrackId?: string;
    bpm?: number; // Es opcional porque puede no estar presente en todos los tracks
  }[];
  lastfmTags?: string[];
  enrichedInfo?: string;
  spotifyAlbumId?: string;
}

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

  if (error) console.error("Error fetching album info:", error);

  const isLoading = !data && !error;

  return {
    data: data?.albumInfo,
    error,
    isLoading,
    isValidating,
  };
};

export default useGetAlbumInfo;
